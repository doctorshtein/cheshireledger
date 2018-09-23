function getUserPartiesAsync(db, userId) {
    return db
        .collection("parties")
        .where("Owners", "array-contains", userId)
        .get();
}

function getPartyLedgersAsync(db, party) {
    return db
        .collection("ledgers")
        .where("Participants", "array-contains", party.id)
        .get();
}

async function loadUserDataAsync(db, userId) {
    try {
        var parties = await getUserPartiesAsync(db, userId);

        var ledgerPromises = parties.docs.map(function (party) {
            console.log(party.id, " => ", party.data());
            return getPartyLedgersAsync(db, party)
        });
        var allLedgerGroups = await Promise.all(ledgerPromises);
        var allLedgers = allLedgerGroups.map(function (q) { return q.docs; }).reduce(function (a, b) { return a.concat(b) });

        allLedgers.forEach(function (ledger) {
            console.log(ledger.id, " => ", ledger.data());
        });

        return { userId: userId, parties: parties.docs, ledgers: allLedgers }; 
    }
    catch (error)
    {
        console.log("Error getting ledgers for the user: ", error);
    }
}

function displayParties(parties) {
    var pt = document.getElementById('party-template');
    var ph = document.getElementById('parties-holder');

    clearChildNodes(ph);

    var itemTemplate = pt.content.querySelector("LI");
    for (let party of parties) {
        var newChild = document.importNode(itemTemplate, true);
        newChild.textContent = party.data().Name;
        ph.appendChild(newChild);
    }
}

function displayLedgers(ledgers) {
    var pt = document.getElementById('ledger-template');
    var ph = document.getElementById('ledgers-holder');

    clearChildNodes(ph);

    var itemTemplate = pt.content.querySelector("A");
    for (let ledger of ledgers) {
        var newChild = document.importNode(itemTemplate, true);
        newChild.textContent = ledger.data().Name;
        newChild.href = "javascript:displayLedgerDetails('" + ledger.id + "');";
        ph.appendChild(newChild);
    }
}

async function displayLedgerDetails(ledgerId) {
    var currentLedger;

    for (let ledger of userData.ledgers) {
        if (ledger.id == ledgerId) {
            currentLedger = ledger;
            break;
        }
    }

    if (!currentLedger) {
        return;
    }

    let portions = await db.collection("ledgers").doc(ledgerId).collection("Portions").get();
    await displayLedgerBalances(portions.docs);

    let transactions = await db.collection("ledgers").doc(ledgerId).collection("Transactions").get();
}

async function displayLedgerBalances(balances) {
    var pt = document.getElementById('balance-template');
    var ph = document.getElementById('balances-holder');

    clearChildNodes(ph);

    var itemTemplate = pt.content.querySelector("TR");
    for (let balance of balances) {
        var newChild = document.importNode(itemTemplate, true);
        newChild.children[0].textContent = (await balance.data().Party.get()).data().Name;
        newChild.children[1].textContent = "$" + balance.data().Paid;

        ph.appendChild(newChild);
    }
}

function getTransactionDetailsAsync(ledgerId, transactionId) {
    return db.collection("ledgers").doc(ledgerId).collection("Transactions").doc(transactionId).get();
}

function clearChildNodes(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

