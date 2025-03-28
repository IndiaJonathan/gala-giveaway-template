<template>
    <Collapsible title="Telegram authentication" :collapsible="false" isOpen class="mb-4">


        <p style="margin-bottom: 32px;" class="explanatory-text">Enable this option to require participants to
            authenticate through Telegram before claiming tokens.
        </p>

        <StyledCheckmark v-model="giveawaySettings.telegramAuthRequired" @change="handleTelegramAuthChange" />
    </Collapsible>

    <Collapsible title="Burn token to claim" :collapsible="false" isOpen>


        <p style="margin-bottom: 32px;" class="explanatory-text">Enable this option to require participants to burn a
            specific token in order to claim their giveaway rewards.
        </p>

        <StyledCheckmark v-model="giveawaySettings.requireBurnTokenToClaim" @change="handleValidityChange" />


        <Collapsible style="padding: 0px; border-radius: 0px; border: none; width: 100%;" :collapsible="true"
            :isOpen="!!giveawaySettings.requireBurnTokenToClaim">
            <div class="divider"></div>

            <BurnTokenSelector 
                ref="tokenSelectRef"
                :available-tokens="availableTokens"
                v-model:selected-token="selectedBurnToken"
                :metadata="metadataMap"
                @token-selected="handleValidityChange"
                style="width: 100%; margin-bottom: 40px; border: none; border-radius: 0px; padding: 0px"
            />
        </Collapsible>
    </Collapsible>
</template>

<script lang="ts" setup>
import { ref, watch, type PropType, type Ref, computed, onMounted } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import InputBox from './InputBox.vue';
import Collapsible from './Collapsible.vue'
import { formatNumber } from '@/utils/Helpers';
import BigNumber from 'bignumber.js';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import StyledCheckmark from './inputs/StyledCheckmark.vue'
import { useProfileStore } from '@/stores/profile';
import TokenSelect from './TokenSelect.vue';
import BurnTokenSelector from './BurnTokenSelector.vue';
import { tokenToReadable } from '@/utils/GalaHelper';
import type { TokenBalance, TokenClass, TokenAllowance } from '@gala-chain/connect';


const emit = defineEmits(['is-valid']);


const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore)
const profileStore = useProfileStore();
const tokenSelectRef = ref();

const { profile, isConnected, error, balances, metadata, createdTokens, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)


const selectedVal = computed({
    get: () => {
        console.log(`Found: ${giveawaySettings.value.giveawayType}`)
        return giveawaySettings.value.giveawayType
    },
    set: (value: string) => {
        console.log("setting value")
        giveawayStore.updateSettings({ giveawayType: value as "FirstComeFirstServe" | "DistributedGiveaway" | undefined });
        console.log(giveawaySettings.value.giveawayType)
    }
});


const totalWinners = computed({
    get: () => giveawaySettings.value.maxWinners ? new BigNumber(giveawaySettings.value.maxWinners) : undefined,
    set: (value) => {
        giveawayStore.updateSettings({ maxWinners: value?.toString() });
    }
});

const totalTokenPrizePool = computed(() => prizePerWinner.value ? prizePerWinner.value.multipliedBy(totalWinners.value ||
    BigNumber(1)) : undefined)
const estimatedGasFee: Ref<BigNumber | undefined> = ref()


const handleTelegramAuthChange = () => {
    // Emit validity change when Telegram auth setting changes
    emit('is-valid', checkAllValid());
};


const handleValidityChange = () => {
    let isValid = true;
    console.log("hit here")
    if (giveawaySettings.value.requireBurnTokenToClaim) {
        const isTokenRefValid = tokenSelectRef.value && tokenSelectRef.value.isValid;
        isValid = isValid && isTokenRefValid;
    }

    // Emit validity change when token selection validity changes
    emit('is-valid', true);
    return true;
};

const checkAllValid = () => {
    // If burn token is required, check if token selection is valid
    // if (giveawaySettings.value.requireBurnTokenToClaim) {
    //     return tokenSelectRef.value && tokenSelectRef.value.isValid;
    // }

    // If neither option requires validation, return true
    return true;
};

const prizePerWinner = computed({
    get: (): BigNumber | undefined => {
        return giveawaySettings.value.winPerUser ? new BigNumber(giveawaySettings.value.winPerUser) : undefined;

    },
    set: (value: BigNumber) => {
        giveawayStore.updateSettings({ winPerUser: value.toString() });
    }
});

function calculateMaxPrize() {
    return (giveawaySettings.value.giveawayToken?.quantity || BigNumber(0))
        .dividedToIntegerBy(totalWinners.value || BigNumber(1));
}

watch(totalWinners, (newVal, oldVal) => {

    if (giveawaySettings.value.giveawayToken?.quantity && totalTokenPrizePool.value?.gt(giveawaySettings.value.giveawayToken?.quantity)) {
        //Set to highest possible amount
        prizePerWinner.value = calculateMaxPrize();
    }
});


watch([totalWinners, prizePerWinner, selectedVal], async () => {
    if (giveawaySettings.value.giveawayTokenType && giveawaySettings.value.giveawayToken && giveawaySettings.value.giveawayType && totalWinners.value) {
        estimatedGasFee.value = giveawayStore.estimateGalaFees()
    }
})

const isValid = computed(() => {
    // For prize-related validation (if needed in this step)
    let prizeValid = true;
    if (giveawaySettings.value.giveawayType) {
        if (prizePerWinner.value && prizePerWinner.value.gte(1) && totalWinners.value && totalWinners.value?.gte(1)) {
            if (!giveawaySettings.value.giveawayToken?.quantity) {
                console.warn('Giveaway token is not set');
                prizeValid = false;
            } else {
                prizeValid = totalTokenPrizePool.value?.lte(giveawaySettings.value.giveawayToken?.quantity) || false;
            }
        } else {
            prizeValid = false;
        }
    }

    // Return overall validity
    return checkAllValid() && (giveawaySettings.value.giveawayType ? prizeValid : true);
});

watch(isValid, (newValue) => {
    emit('is-valid', checkAllValid());
});

// Make sure we emit the initial validity state when component is mounted
onMounted(() => {
    emit('is-valid', checkAllValid());
});

const metadataMap = computed(() => {
    const map = new Map<string, TokenClass>();

    if (metadata.value) {
        metadata.value.forEach(metadata => {
            const key = tokenToReadable(metadata);
            map.set(key, metadata);
        });
    }
    return map;
});

const availableTokens = computed(() => {
    const tokens: TokenBalance[] = [];
    
    // Add balances
    if (balances.value?.availableBalances) {
        tokens.push(...balances.value.availableBalances);
    }
    
    // Add allowances if they exist
    const allowances = (balances.value as any)?.allowances as TokenAllowance[] | undefined;
    if (allowances) {
        // Convert allowances to token balances
        const allowanceTokens = allowances.map(allowance => ({
            owner: allowance.grantedTo,
            collection: allowance.collection,
            category: allowance.category,
            type: allowance.type,
            additionalKey: allowance.additionalKey,
            quantity: allowance.quantity,
            instanceIds: [] as BigNumber[],
            lockedHolds: [],
            inUseHolds: []
        } as TokenBalance));
        tokens.push(...allowanceTokens);
    }
    
    // Remove duplicates by comparing collection, category, and type
    return tokens.filter((token, index, self) => 
        index === self.findIndex(t => 
            t.collection === token.collection &&
            t.category === token.category &&
            t.type === token.type
        )
    );
});

const selectedBurnToken = computed({
    get: () => {
        if (!giveawaySettings.value.burnToken) return undefined;
        
        // Find the matching token from available tokens
        return availableTokens.value.find(token => 
            token.collection === giveawaySettings.value.burnToken?.collection &&
            token.category === giveawaySettings.value.burnToken?.category &&
            token.type === giveawaySettings.value.burnToken?.type &&
            token.additionalKey === giveawaySettings.value.burnToken?.additionalKey
        );
    },
    set: (token: TokenBalance | undefined) => {
        if (!token) {
            giveawayStore.updateSettings({ burnToken: undefined });
            return;
        }
        
        // Store only the necessary token identification fields
        giveawayStore.updateSettings({
            burnToken: {
                collection: token.collection,
                category: token.category,
                type: token.type,
                additionalKey: token.additionalKey
            }
        });
    }
});

defineExpose({ isValid });
</script>

<style scoped>
.explanatory-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
    color: rgba(255, 255, 255, 0.6);
}

.divider {
    width: 100%;
    height: 2px;
    background-color: rgba(255, 255, 255, 0.1);
    margin-bottom: 32px;
}


.token-selection {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 6px;
    border-radius: 16px;
    border: 1px solid rgba(236, 236, 236, 0.1);
}

.label {
    font-size: 16px;
    color: white;
}

.required {
    color: red;
}

.token-item {
    display: flex;
    align-items: center;
    background-color: #181818;
    padding: 16px;
    border-radius: 12px;
    width: 100%;
    transition: background-color 0.3s ease;
}

.token-item:hover {
    background-color: #1f1f1f;
}

.token-icon {
    width: 40px;
    /* Adjust the size of the icon */
    height: 40px;
    margin-right: 16px;
}

.token-icon-circle {
    width: 40px;
    /* Circle size */
    height: 40px;
    border-radius: 50%;
    background-color: #333333;
    /* Color of the circle */
    margin-right: 16px;
}

.token-details {
    display: flex;
    flex-direction: column;
}

.token-name {
    color: white;
}

.token-balance {
    color: #9E9E9E;
    margin-top: 4px;
}


.container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 32px;
    height: 77px;
    text-align: left;
}

.row {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: left;
    padding-right: 32px;
}

.value {
    font-size: 18px;
    font-weight: bold;
    color: white;
}
</style>