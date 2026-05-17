// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ProvableNFT.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ProvableNFT nft = new ProvableNFT();
        
        console.log("ProvableNFT deployed at:", address(nft));
        console.log("Owner:", nft.owner());
        
        vm.stopBroadcast();
    }
}
