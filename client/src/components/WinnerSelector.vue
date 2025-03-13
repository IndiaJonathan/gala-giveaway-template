<template>
    <Collapsible title="Winner type" :collapsible="true" :isOpen="!!giveawaySettings.giveawayToken">


        <p style="margin-bottom: 32px;" class="explanatory-text"> Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Curabitur iaculis pharetra lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
        </p>

        {{ giveawaySettings.giveawayType }}

        <ToggleSwitch v-model:selected="selectedVal" style="margin-bottom: 32px; width: 100%;" :options="[{ key: 'FirstComeFirstServe', label: '1st come, 1st served' },
        { key: 'DistributedGiveaway', label: 'Raffle' }]">
        </ToggleSwitch>

        <div class="container" v-if="giveawaySettings.giveawayToken">
            <div class="row">
                <div class="info-item">
                    <span class="subtitle">$TOKEN BALANCE</span>
                    <span class="paragraph-small-regular">{{ formatNumber(new
                        BigNumber(giveawaySettings.giveawayToken.quantity))
                        }}</span>
                </div>
                <div class="info-item">
                    <span class="subtlitle">$TOKEN PRIZE POOL</span>
                    <span class="paragraph-small-regular">{{ formatNumber(totalTokenPrizePool) }}</span>
                </div>
                <div class="info-item">
                    <span class="subtitle">EST. $GALA GAS FEE</span>
                    <span class="paragraph-small-regular">{{ estimatedGasFee }}</span>
                </div>
            </div>
        </div>


        <InputBox v-model="totalWinners" style="margin-bottom: 32px;" placeholder="Number of winners">
        </InputBox>
        <InputBox placeholder="Prize per winner" v-model="prizePerWinner" style="margin-bottom: 32px;" :onSlotClick="() => {
            prizePerWinner = calculateMaxPrize()
        }">
            MAX
        </InputBox>


    </Collapsible>
</template>

<script lang="ts" setup>
import { ref, watch, type PropType, type Ref, computed } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import InputBox from './InputBox.vue';
import Collapsible from './Collapsible.vue'
import { formatNumber } from '@/utils/Helpers';
import BigNumber from 'bignumber.js';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';


const emit = defineEmits(['is-valid']);


const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore)


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


const prizePerWinner = computed({
    get: (): BigNumber | undefined => {
        if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
            return giveawaySettings.value.claimPerUser ? new BigNumber(giveawaySettings.value.claimPerUser) : undefined;
        } else if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
            return giveawaySettings.value.tokenQuantity ? new BigNumber(giveawaySettings.value.tokenQuantity) : undefined;
        }
        return undefined;
    },
    set: (value: BigNumber) => {
        console.log('setting prize per winner', value)
        if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
            giveawayStore.updateSettings({ claimPerUser: value.toString() });
        } else if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
            giveawayStore.updateSettings({ tokenQuantity: value.toString() });
        }
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
        estimatedGasFee.value =  giveawayStore.estimateGalaFees()
    }
})

const isValid = computed(() => {
    if (prizePerWinner.value && prizePerWinner.value.gte(1) && totalWinners.value && totalWinners.value?.gte(1)) {
        if (!giveawaySettings.value.giveawayToken?.quantity) {
            console.warn('Giveaway token is not set')
        } else {
            return totalTokenPrizePool.value?.lte(giveawaySettings.value.giveawayToken?.quantity)
        }
    }
    return false;
});

watch(isValid, (newValue) => {
    emit('is-valid', newValue);
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