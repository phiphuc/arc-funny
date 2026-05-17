// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProvableNFT.sol";

contract ProvableNFTTest is Test {
    ProvableNFT public nft;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        nft = new ProvableNFT();
    }

    function testMintScore() public {
        nft.mintScore(user1, 85, 4, "ipfs://QmTest123");

        ProvableNFT.Score memory score = nft.getScore(user1);
        assertEq(score.totalScore, 85);
        assertEq(score.tier, 4);
        assertEq(keccak256(bytes(score.metadataURI)), keccak256(bytes("ipfs://QmTest123")));
        assertGt(score.timestamp, 0);

        uint256 tokenId = nft.tokenIds(user1);
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(nft.totalSupply(), 1);
    }

    function testUpdateScore() public {
        nft.mintScore(user1, 50, 2, "ipfs://v1");
        nft.updateScore(user1, 80, 4, "ipfs://v2");

        ProvableNFT.Score memory score = nft.getScore(user1);
        assertEq(score.totalScore, 80);
        assertEq(score.tier, 4);
        // Token count should NOT increase on update
        assertEq(nft.totalSupply(), 1);
    }

    function testCannotMintInvalidScore() public {
        vm.expectRevert("Invalid score");
        nft.mintScore(user1, 101, 0, "ipfs://test");
    }

    function testCannotMintInvalidTier() public {
        vm.expectRevert("Invalid tier");
        nft.mintScore(user1, 50, 5, "ipfs://test");
    }

    function testCannotUpdateNonexistent() public {
        vm.expectRevert("No NFT exists");
        nft.updateScore(user1, 80, 4, "ipfs://test");
    }

    function testMultipleUsers() public {
        nft.mintScore(user1, 90, 4, "ipfs://diamond");
        nft.mintScore(user2, 15, 0, "ipfs://bronze");

        assertEq(nft.getScore(user1).totalScore, 90);
        assertEq(nft.getScore(user2).totalScore, 15);
        assertEq(nft.getScore(user1).tier, 4);
        assertEq(nft.getScore(user2).tier, 0);
        assertEq(nft.totalSupply(), 2);
    }

    function testTokenURI() public {
        nft.mintScore(user1, 85, 4, "ipfs://metadata");
        uint256 tokenId = nft.tokenIds(user1);
        assertEq(keccak256(bytes(nft.tokenURI(tokenId))), keccak256(bytes("ipfs://metadata")));
    }

    function testHasScore() public {
        assertFalse(nft.hasScore(user1));
        nft.mintScore(user1, 50, 2, "ipfs://test");
        assertTrue(nft.hasScore(user1));
    }

    function testSoulbound() public {
        nft.mintScore(user1, 85, 4, "ipfs://test");
        uint256 tokenId = nft.tokenIds(user1);

        vm.prank(user1);
        vm.expectRevert("Soulbound: non-transferable");
        nft.transferFrom(user1, user2, tokenId);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        nft.mintScore(user2, 50, 2, "ipfs://test");
    }

    function testOnlyOwnerCanUpdate() public {
        nft.mintScore(user1, 50, 2, "ipfs://v1");

        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        nft.updateScore(user1, 80, 4, "ipfs://v2");
    }

    function testRemintSameWallet() public {
        // Minting same wallet twice should update, not create new token
        nft.mintScore(user1, 50, 2, "ipfs://v1");
        nft.mintScore(user1, 80, 4, "ipfs://v2");

        assertEq(nft.totalSupply(), 1); // Still 1 token
        assertEq(nft.getScore(user1).totalScore, 80);
    }
}
