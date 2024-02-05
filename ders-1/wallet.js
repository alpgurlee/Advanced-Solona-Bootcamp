// wallet.js
const { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function createWallet() {
    const wallet = Keypair.generate();
    const publicKey = wallet.publicKey.toString();
    const secretKey = Array.from(wallet.secretKey);

    // Bakiyeyi JSON dosyasına kaydet
    const walletData = { publicKey, secretKey: Array.from(wallet.secretKey) };

    fs.writeFileSync('wallet.json', JSON.stringify(walletData, null, 2));
  
    console.log('Cüzdan oluşturuldu:', publicKey);
    // Başlangıç bakiyesini kontrol et
    await getBalance(publicKey);
}

async function getBalance(publicKeyStr) {
    const publicKey = new PublicKey(publicKeyStr);
    const balance = await connection.getBalance(publicKey);
    console.log(`Bakiye: ${balance / LAMPORTS_PER_SOL} SOL`);
}

async function airdrop(publicKeyStr, sol = 1) {
    const publicKey = new PublicKey(publicKeyStr);
    const airdropSignature = await connection.requestAirdrop(publicKey, sol * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSignature);
    console.log(`${sol} SOL airdrop alındı.`);
}

async function transfer(senderSecretKey, recipientPublicKeyStr, sol) {
    const senderKeypair = Keypair.fromSecretKey(new Uint8Array(senderSecretKey));
    const recipientPublicKey = new PublicKey(recipientPublicKeyStr);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: recipientPublicKey,
            lamports: sol * LAMPORTS_PER_SOL,
        })
    );

    const signature = await connection.sendTransaction(transaction, [senderKeypair], {skipPreflight: false, preflightCommitment: 'confirmed'});
    await connection.confirmTransaction(signature, 'confirmed');
    console.log(`${sol} SOL, ${recipientPublicKeyStr} adresine transfer edildi.`);
}

async function main() {
    const args = process.argv.slice(2);
    switch (args[0]) {
        case 'new':
            await createWallet();
            break;
        case 'balance':
            await getBalance(JSON.parse(fs.readFileSync('wallet.json')).publicKey);
            break;
        case 'airdrop':
            const amount = args[1] ? parseInt(args[1], 10) : 1;
            await airdrop(JSON.parse(fs.readFileSync('wallet.json')).publicKey, amount);
            break;
        case 'transfer':
            const recipientPublicKey = args[1];
            const sendAmount = args[2] ? parseFloat(args[2]) : 0;
            const walletData = JSON.parse(fs.readFileSync('wallet.json'));
            const publicKey = walletData.publicKey;

            await transfer(walletData.secretKey, recipientPublicKey, sendAmount);
            break;
        default:
            console.log('Unknown command');
    }
}

main().then(() => {
    console.log('İşlem tamamlandı.');
}).catch((error) => {
    console.error('Bir hata oluştu:', error);
});

//solana airdrop 1 BZUwVxjo2BeCSmjHfm4uLufFcUi3nfwpaGDPhDpua7Tq XQE --url https://api.devnet.solana.com