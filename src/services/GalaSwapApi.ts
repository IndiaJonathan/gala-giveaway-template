// Load the base URL from environment variables
const baseURL = import.meta.env.VITE_GALA_SWAP_API;

interface GetPublicKeyRequest {
    user: string;
}

interface GetPublicKeyResponse {
    Data: {
        publicKey: string;
    };
}

interface CreateHeadlessWalletRequest {
    publicKey: string;
}

interface CreateHeadlessWalletResponse {
    walletId: string;
}

// Function to call the GetPublicKey API
export async function getPublicKey(user: string): Promise<string | null> {
    try {
        const requestBody: GetPublicKeyRequest = {
            user,
        };

        const response = await fetch(`${baseURL}/galachain/api/asset/public-key-contract/GetPublicKey`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: GetPublicKeyResponse = await response.json();

        if (data && data.Data && data.Data.publicKey) {
            return data.Data.publicKey;
        }

        return null;
    } catch (error) {
        console.error('Error fetching public key:', error);
        return null;
    }
}

// Function to call the CreateHeadlessWallet API
export async function createHeadlessWallet(publicKey: string): Promise<string | null> {
    try {
        const requestBody: CreateHeadlessWalletRequest = {
            publicKey,
        };

        const response = await fetch(`${baseURL}/v1/CreateHeadlessWallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: CreateHeadlessWalletResponse = await response.json();

        if (data && data.walletId) {
            return data.walletId;
        }

        return null;
    } catch (error) {
        console.error('Error creating headless wallet:', error);
        return null;
    }
}

// Example usage
// getPublicKey('client|0123456789abcdef01234567').then(publicKey => {
//   console.log('Public Key:', publicKey);
// });

// createHeadlessWallet('0x02c5953291283d92392fad8d7ed2f77a976c35a472a5554dbe63c2269eacd8ff52').then(walletId => {
//   console.log('Wallet ID:', walletId);
// });