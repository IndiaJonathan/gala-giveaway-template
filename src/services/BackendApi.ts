// Load the base URL from environment variables
const baseURL = import.meta.env.VITE_API_BASE_URL;

interface GiveawayDto {
    giveawayToken: string;
    amount: string;
    signature: string;
    endTime?: Date;
}

interface StartGiveawayResponse {
    success: boolean;
    message: string;
}


export async function GetAdminWallet() {
    try {
        const response = await fetch(`${baseURL}/api/adminWallet`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: {
            publicKey: string,
            gc_address: string,
        } = await response.json();

        if (data) {
            return data;
        }

        return null;
    } catch (error) {
        console.error('Error getting admin wallet:', error);
        return null;
    }
}

export async function startGiveaway(giveaway: GiveawayDto): Promise<StartGiveawayResponse | null> {
    try {
        const response = await fetch(`${baseURL}/api/giveaway/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(giveaway),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data: StartGiveawayResponse = await response.json();

        if (data && data.success) {
            return data;
        }

        return null;
    } catch (error) {
        console.error('Error starting giveaway:', error);
        return null;
    }
}

// Example usage
// const giveaway: GiveawayDto = {
//   giveawayToken: 'some-token-value',
//   amount: '100',
//   endTime: new Date('2024-12-31T23:59:59Z'),
// };
//
// startGiveaway(giveaway).then(response => {
//   if (response) {
//     console.log('Giveaway started successfully:', response);
//   } else {
//     console.log('Failed to start giveaway');
//   }
// });