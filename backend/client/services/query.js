/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { getWalletPath, CCP } = require('../config/util');
const register = require('./registerUser');

const queryTransaction = async (channelName, chaincodeName, fcn, args, username, org_name, transientData) => {
    try {
        const ccp = await CCP(org_name);
        const walletPath = await getWalletPath(org_name);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(username);
        if (!identity) {
            console.log('An identity for the user "appUser1" does not exist in the wallet');
            await register.registerUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const connectOptions = {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: true }
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, connectOptions);

        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        let result;
        if (fcn == "queryAllCars") {
            result = await contract.evaluateTransaction('queryAllCars');
            result = JSON.parse(result.toString());
        }
        if (fcn == "QueryCar") {
            result = await contract.evaluateTransaction('QueryCar', args.carKey);
            result = JSON.parse(result.toString());
        }
        if (fcn == "TotalSupply") {
            result = await contract.evaluateTransaction('TotalSupply');
        }
        if (fcn == "getbalance") {
            result = await contract.evaluateTransaction('ClientAccountBalance');
        }
        if (fcn == "getclientID") {
            result = await contract.evaluateTransaction('ClientAccountID');
        }
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();

        let response = {
            message: "Success",
            result
        }

        return response;

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

module.exports = { queryTransaction }
