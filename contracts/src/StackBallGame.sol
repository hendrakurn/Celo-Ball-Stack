// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StackBallGame
 * @notice Onchain leaderboard + prize distribution for Stack Ball Celo
 * @dev Deployed on Celo Mainnet. Prize pool funded by owner (developer).
 *      Players pay only gas fee to start game and submit score.
 *      Top 3 per 3-day period win CELO prizes automatically.
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract StackBallGame is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    constructor() {
        _disableInitializers(); // ← wajib ada, blokir initialize di implementation langsung
    }

    function initialize(address owner) public initializer {
        __Ownable_init(owner);
        periodDuration = 3 days;
        periodStart = block.timestamp;
        periodNumber = 1;
        prize1 = 15 ether;
        prize2 = 13 ether;
        prize3 = 10 ether;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyStackBallOwner {}

    struct PlayerScore {
        address player;
        uint256 score;
        uint256 rank;
        uint256 submittedAt;
    }

    struct PlayerStats {
        uint256 totalGames;
        uint256 bestScore;
        uint256 currentPeriodScore;
        uint256 currentRank;
        bool hasSubmittedThisPeriod;
    }

    struct GameSession {
        address player;
        uint256 startTime;
        bool isActive;
        bool isSubmitted;
    }

    uint256 public periodDuration;
    uint256 public periodStart;
    uint256 public periodNumber;

    uint256 public prize1;
    uint256 public prize2;
    uint256 public prize3;

    uint256 public constant MAX_LEADERBOARD = 50;
    uint256 public constant MIN_GAME_DURATION = 10 seconds;
    uint256 public constant SUBMIT_COOLDOWN = 30 seconds;

    PlayerScore[] public leaderboard;
    mapping(address => PlayerStats) public playerStats;
    mapping(bytes32 => GameSession) public sessions;
    mapping(address => bytes32) public activeSession;
    mapping(bytes32 => bool) public usedHashes;
    mapping(address => uint256) public lastSubmitTime;

    event GameStarted(address indexed player, bytes32 indexed sessionId, uint256 timestamp);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 rank, uint256 periodNumber, uint256 timestamp);
    event RewardsDistributed(
        address indexed winner1,
        address indexed winner2,
        address indexed winner3,
        uint256 amount1,
        uint256 amount2,
        uint256 amount3,
        uint256 periodNumber
    );
    event LeaderboardReset(uint256 indexed periodNumber, uint256 timestamp);
    event PrizeDeposited(address indexed from, uint256 amount, uint256 contractBalance);

    modifier onlyStackBallOwner() {
        require(msg.sender == owner(), "StackBall: not owner");
        _;
    }

    modifier periodActive() {
        require(!_isPeriodExpired(), "StackBall: period expired, call distributeRewards");
        _;
    }
    /*
        constructor() {
            owner = msg.sender;
            periodStart = block.timestamp;
            periodNumber = 1;
        }
    */

    function startGame() external periodActive returns (bytes32 sessionId) {
        sessionId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, block.prevrandao, playerStats[msg.sender].totalGames)
        );

        bytes32 prevSession = activeSession[msg.sender];
        if (prevSession != bytes32(0)) {
            sessions[prevSession].isActive = false;
        }

        sessions[sessionId] =
            GameSession({player: msg.sender, startTime: block.timestamp, isActive: true, isSubmitted: false});

        activeSession[msg.sender] = sessionId;
        playerStats[msg.sender].totalGames++;

        emit GameStarted(msg.sender, sessionId, block.timestamp);
    }

    function submitScore(uint256 totalScore, bytes32 gameHash) external periodActive {
        require(!usedHashes[gameHash], "StackBall: hash already used");

        bytes32 sessionId = activeSession[msg.sender];
        require(sessionId != bytes32(0), "StackBall: no active session");

        GameSession storage session = sessions[sessionId];
        require(session.player == msg.sender, "StackBall: not your session");
        require(session.isActive, "StackBall: session not active");
        require(!session.isSubmitted, "StackBall: already submitted");
        require(block.timestamp >= session.startTime + MIN_GAME_DURATION, "StackBall: game too short");
        require(
            lastSubmitTime[msg.sender] == 0 || block.timestamp >= lastSubmitTime[msg.sender] + SUBMIT_COOLDOWN,
            "StackBall: submit too soon"
        );
        require(totalScore > 0, "StackBall: score must be positive");

        usedHashes[gameHash] = true;
        session.isActive = false;
        session.isSubmitted = true;
        activeSession[msg.sender] = bytes32(0);
        lastSubmitTime[msg.sender] = block.timestamp;

        PlayerStats storage stats = playerStats[msg.sender];
        if (totalScore > stats.bestScore) {
            stats.bestScore = totalScore;
        }

        if (totalScore > stats.currentPeriodScore) {
            stats.currentPeriodScore = totalScore;
            stats.hasSubmittedThisPeriod = true;
        } else {
            emit ScoreSubmitted(msg.sender, totalScore, 0, periodNumber, block.timestamp);
            return;
        }

        uint256 rank = _updateLeaderboard(msg.sender, totalScore);
        stats.currentRank = rank;

        emit ScoreSubmitted(msg.sender, totalScore, rank, periodNumber, block.timestamp);
    }

    function distributeRewards() external onlyStackBallOwner {
        require(_isPeriodExpired(), "StackBall: period not yet expired");
        require(address(this).balance >= prize1 + prize2 + prize3, "StackBall: insufficient balance");

        address winner1 = address(0);
        address winner2 = address(0);
        address winner3 = address(0);
        uint256 paid1 = 0;
        uint256 paid2 = 0;
        uint256 paid3 = 0;

        uint256 len = leaderboard.length;

        if (len >= 1) {
            winner1 = leaderboard[0].player;
            paid1 = prize1;
            (bool ok1,) = payable(winner1).call{value: paid1}("");
            require(ok1, "StackBall: transfer to winner1 failed");
        }

        if (len >= 2) {
            winner2 = leaderboard[1].player;
            paid2 = prize2;
            (bool ok2,) = payable(winner2).call{value: paid2}("");
            require(ok2, "StackBall: transfer to winner2 failed");
        }

        if (len >= 3) {
            winner3 = leaderboard[2].player;
            paid3 = prize3;
            (bool ok3,) = payable(winner3).call{value: paid3}("");
            require(ok3, "StackBall: transfer to winner3 failed");
        }

        emit RewardsDistributed(winner1, winner2, winner3, paid1, paid2, paid3, periodNumber);
        _resetPeriod();
    }

    function forceReset() external onlyStackBallOwner {
        _resetPeriod();
    }

    function depositPrize() external payable onlyStackBallOwner {
        require(msg.value > 0, "StackBall: must send CELO");
        emit PrizeDeposited(msg.sender, msg.value, address(this).balance);
    }

    function setPrizes(uint256 _p1, uint256 _p2, uint256 _p3) external onlyStackBallOwner {
        prize1 = _p1;
        prize2 = _p2;
        prize3 = _p3;
    }

    function emergencyWithdraw() external onlyStackBallOwner {
        (bool ok,) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "StackBall: withdraw failed");
    }

    function getLeaderboard() external view returns (PlayerScore[] memory) {
        return leaderboard;
    }

    function getTimeUntilReset() external view returns (uint256) {
        uint256 expiry = periodStart + periodDuration;
        if (block.timestamp >= expiry) return 0;
        return expiry - block.timestamp;
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isPeriodExpired() external view returns (bool) {
        return _isPeriodExpired();
    }

    function getPrizes() external view returns (uint256, uint256, uint256) {
        return (prize1, prize2, prize3);
    }

    function getLeaderboardTop3()
        external
        view
        returns (address p1, uint256 s1, address p2, uint256 s2, address p3, uint256 s3)
    {
        uint256 len = leaderboard.length;
        if (len >= 1) {
            p1 = leaderboard[0].player;
            s1 = leaderboard[0].score;
        }
        if (len >= 2) {
            p2 = leaderboard[1].player;
            s2 = leaderboard[1].score;
        }
        if (len >= 3) {
            p3 = leaderboard[2].player;
            s3 = leaderboard[2].score;
        }
    }

    function _isPeriodExpired() internal view returns (bool) {
        return block.timestamp >= periodStart + periodDuration;
    }

    function _resetPeriod() internal {
        delete leaderboard;
        periodNumber++;
        periodStart = block.timestamp;

        emit LeaderboardReset(periodNumber, block.timestamp);
    }

    function _updateLeaderboard(address player, uint256 score) internal returns (uint256 rank) {
        uint256 len = leaderboard.length;

        for (uint256 i = 0; i < len; i++) {
            if (leaderboard[i].player == player) {
                leaderboard[i].score = score;
                leaderboard[i].submittedAt = block.timestamp;
                _sortFrom(i);
                for (uint256 j = 0; j < leaderboard.length; j++) {
                    if (leaderboard[j].player == player) {
                        leaderboard[j].rank = j + 1;
                        return j + 1;
                    }
                }
            }
        }

        if (len < MAX_LEADERBOARD || (len > 0 && score > leaderboard[len - 1].score)) {
            if (len == MAX_LEADERBOARD) {
                leaderboard[len - 1] =
                    PlayerScore({player: player, score: score, rank: len, submittedAt: block.timestamp});
            } else {
                leaderboard.push(
                    PlayerScore({player: player, score: score, rank: len + 1, submittedAt: block.timestamp})
                );
            }

            _bubbleSort();

            for (uint256 i = 0; i < leaderboard.length; i++) {
                leaderboard[i].rank = i + 1;
                if (leaderboard[i].player == player) {
                    rank = i + 1;
                }
            }
        }
    }

    function _sortFrom(uint256 idx) internal {
        while (idx > 0 && leaderboard[idx].score > leaderboard[idx - 1].score) {
            PlayerScore memory temp = leaderboard[idx];
            leaderboard[idx] = leaderboard[idx - 1];
            leaderboard[idx - 1] = temp;
            idx--;
        }
    }

    function _bubbleSort() internal {
        uint256 n = leaderboard.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (leaderboard[j].score < leaderboard[j + 1].score) {
                    PlayerScore memory temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                }
            }
        }
    }

    receive() external payable {}
    fallback() external payable {}
}
