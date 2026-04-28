// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StackBallGame.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StackBallGameTest is Test {
    StackBallGame public game;
    address public player1 = makeAddr("player1");
    address public player2 = makeAddr("player2");
    address public player3 = makeAddr("player3");

    event GameStarted(address indexed player, bytes32 indexed sessionId, uint256 timestamp);

    function setUp() public {
        // Deploy implementation
        StackBallGame implementation = new StackBallGame();

        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation), abi.encodeWithSelector(StackBallGame.initialize.selector, address(this))
        );

        // Cast proxy ke StackBallGame
        game = StackBallGame(payable(address(proxy)));

        vm.deal(address(game), 100 ether);
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
        vm.deal(player3, 1 ether);
    }

    function test_StartGame_ReturnsSessionId() public {
        vm.prank(player1);
        bytes32 sessionId = game.startGame();
        assertTrue(sessionId != bytes32(0));
    }

    function test_StartGame_EmitsEvent() public {
        vm.prank(player1);
        vm.expectEmit(true, false, false, false);
        emit GameStarted(player1, bytes32(0), 0);
        game.startGame();
    }

    function test_StartGame_IncrementsTotalGames() public {
        vm.prank(player1);
        game.startGame();
        StackBallGame.PlayerStats memory stats = game.getPlayerStats(player1);
        assertEq(stats.totalGames, 1);
    }

    function test_StartGame_MultipleGames() public {
        vm.startPrank(player1);
        game.startGame();
        vm.warp(block.timestamp + 15);
        game.startGame();
        StackBallGame.PlayerStats memory stats = game.getPlayerStats(player1);
        assertEq(stats.totalGames, 2);
        vm.stopPrank();
    }

    function _startAndWait(address player) internal returns (bytes32 sessionId) {
        vm.prank(player);
        sessionId = game.startGame();
        vm.warp(block.timestamp + 15);
    }

    function _makeHash(address player, uint256 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(player, salt));
    }

    function test_SubmitScore_Success() public {
        _startAndWait(player1);
        bytes32 hash = _makeHash(player1, 1);
        vm.prank(player1);
        game.submitScore(100, hash);
        StackBallGame.PlayerStats memory stats = game.getPlayerStats(player1);
        assertEq(stats.currentPeriodScore, 100);
    }

    function test_SubmitScore_UpdatesLeaderboard() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(500, _makeHash(player1, 1));
        StackBallGame.PlayerScore[] memory lb = game.getLeaderboard();
        assertEq(lb.length, 1);
        assertEq(lb[0].player, player1);
        assertEq(lb[0].score, 500);
    }

    function test_SubmitScore_RejectsReplayHash() public {
        _startAndWait(player1);
        bytes32 hash = _makeHash(player1, 99);
        vm.prank(player1);
        game.submitScore(100, hash);

        vm.warp(block.timestamp + 60);
        vm.prank(player1);
        game.startGame();
        vm.warp(block.timestamp + 15);

        vm.prank(player1);
        vm.expectRevert("StackBall: hash already used");
        game.submitScore(200, hash);
    }

    function test_SubmitScore_RejectsTooFast() public {
        vm.prank(player1);
        game.startGame();
        vm.prank(player1);
        vm.expectRevert("StackBall: game too short");
        game.submitScore(100, _makeHash(player1, 2));
    }

    function test_SubmitScore_RejectsCooldown() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(100, _makeHash(player1, 3));

        vm.prank(player1);
        game.startGame();
        vm.warp(block.timestamp + 15);

        vm.prank(player1);
        vm.expectRevert("StackBall: submit too soon");
        game.submitScore(200, _makeHash(player1, 4));
    }

    function test_SubmitScore_OnlyHigherScoreUpdatesLeaderboard() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(500, _makeHash(player1, 5));

        vm.warp(block.timestamp + 60);
        vm.prank(player1);
        game.startGame();
        vm.warp(block.timestamp + 15);

        vm.prank(player1);
        game.submitScore(200, _makeHash(player1, 6));

        StackBallGame.PlayerScore[] memory lb = game.getLeaderboard();
        assertEq(lb[0].score, 500);
    }

    function test_LeaderboardOrdering_Top3Correct() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(300, _makeHash(player1, 10));

        vm.warp(block.timestamp + 60);
        _startAndWait(player2);
        vm.prank(player2);
        game.submitScore(500, _makeHash(player2, 11));

        vm.warp(block.timestamp + 60);
        _startAndWait(player3);
        vm.prank(player3);
        game.submitScore(100, _makeHash(player3, 12));

        StackBallGame.PlayerScore[] memory lb = game.getLeaderboard();
        assertEq(lb[0].player, player2);
        assertEq(lb[1].player, player1);
        assertEq(lb[2].player, player3);
        assertEq(lb[0].rank, 1);
        assertEq(lb[1].rank, 2);
        assertEq(lb[2].rank, 3);
    }

    function test_DistributeRewards_TransfersCorrectAmounts() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(500, _makeHash(player1, 20));

        vm.warp(block.timestamp + 60);
        _startAndWait(player2);
        vm.prank(player2);
        game.submitScore(300, _makeHash(player2, 21));

        vm.warp(block.timestamp + 60);
        _startAndWait(player3);
        vm.prank(player3);
        game.submitScore(100, _makeHash(player3, 22));

        uint256 bal1Before = player1.balance;
        uint256 bal2Before = player2.balance;
        uint256 bal3Before = player3.balance;

        vm.warp(block.timestamp + 3 days + 1);
        game.distributeRewards();

        assertEq(player1.balance - bal1Before, 15 ether);
        assertEq(player2.balance - bal2Before, 13 ether);
        assertEq(player3.balance - bal3Before, 10 ether);
    }

    function test_DistributeRewards_OnlyOwner() public {
        vm.warp(block.timestamp + 3 days + 1);
        vm.prank(player1);
        vm.expectRevert("StackBall: not owner");
        game.distributeRewards();
    }

    function test_DistributeRewards_ResetsLeaderboard() public {
        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(500, _makeHash(player1, 30));

        vm.warp(block.timestamp + 3 days + 1);
        game.distributeRewards();

        StackBallGame.PlayerScore[] memory lb = game.getLeaderboard();
        assertEq(lb.length, 0);
    }

    function test_DistributeRewards_FailsIfPeriodNotExpired() public {
        vm.expectRevert("StackBall: period not yet expired");
        game.distributeRewards();
    }

    function test_GetTimeUntilReset() public {
        uint256 timeLeft = game.getTimeUntilReset();
        assertApproxEqAbs(timeLeft, 3 days, 5);
    }

    function test_GetTimeUntilReset_ReturnsZeroAfterExpiry() public {
        vm.warp(block.timestamp + 3 days + 100);
        assertEq(game.getTimeUntilReset(), 0);
    }

    function testFuzz_SubmitScore_HigherScoreWins(uint256 scoreA, uint256 scoreB) public {
        vm.assume(scoreA > 0 && scoreA < 1_000_000);
        vm.assume(scoreB > scoreA && scoreB < 1_000_000);

        _startAndWait(player1);
        vm.prank(player1);
        game.submitScore(scoreA, _makeHash(player1, scoreA));

        vm.warp(block.timestamp + 60);
        vm.prank(player1);
        game.startGame();
        vm.warp(block.timestamp + 15);
        vm.prank(player1);
        game.submitScore(scoreB, _makeHash(player1, scoreB));

        StackBallGame.PlayerStats memory stats = game.getPlayerStats(player1);
        assertEq(stats.currentPeriodScore, scoreB);
    }
}
