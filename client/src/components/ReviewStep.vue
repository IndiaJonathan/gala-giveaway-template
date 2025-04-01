<template>
    <div>
        <!-- Details Section -->
        <Collapsible title="Details" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                Review the details of your giveaway before publishing. These settings cannot be changed after
                publishing.
            </p>

            <div class="summary-item">
                <div class="label">TOTAL TOKENS TO GIVEAWAY :</div>
                <div class="value">{{ requiredTokenAmount }}</div>
            </div>

            <div class="summary-item">
                <div class="label">NUMBER OF WINNERS:</div>
                <div class="value">{{ numberOfWinners }}</div>
            </div>

            <div class="summary-item">
                <div class="label">Giveaway Type:</div>
                <div class="value">{{ criteria }}</div>
            </div>

            <div class="summary-item">
                <div class="label">START DATE:</div>
                <div class="value">{{ startDate }}</div>
            </div>

            <div class="summary-item">
                <div class="label">END DATE:</div>
                <div class="value">{{ endDate }}</div>
            </div>

            <div class="summary-item">
                <div class="label">TOKEN:</div>
                <div class="value">{{ token }}</div>
            </div>


            <div class="summary-item">
                <div class="label">Giveaway Duration:</div>
                <div class="value">{{ giveawayDuration }}</div>
            </div>
        </Collapsible>

        <!-- Settings Section -->
        <Collapsible title="Burn Token Settings" :collapsible="false" isOpen class="mb-4">
            <div class="summary-item">
                <div class="label">TOKEN REQUIRED TO PARTICIPATE:</div>
                <div class="value">{{ requiredTokenToClaim }}</div>
            </div>

            <div class="summary-item">
                <div class="label">REQUIRED TOKEN BURN AMOUNT:</div>
                <div class="value">{{ requiredTokenQuantityToClaim }}</div>
            </div>


        </Collapsible>

        <!-- Allowance Section -->
        <Collapsible title="Escrow Wallet" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                This section shows the wallet that will hold your giveaway tokens and the total amount of tokens that
                will be distributed to winners.
            </p>

            <div class="summary-item">
                <div class="label">GIVEAWAY ESCROW WALLET:</div>
                <div class="value">{{ giveawayWalletAddress }}</div>
            </div>

            <div class="summary-item">
                <div class="label">GIVEAWAY TOKEN AMOUNT:</div>
                <div class="value">{{ giveawayTokenAmount }}</div>
            </div>
        </Collapsible>

        <!-- Ready to Publish Section -->
        <Collapsible title="Ready to publish" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                Once published, your giveaway cannot be canceled or modified. Please review all details carefully before
                proceeding and agree to the terms below.
            </p>

            <div class="warning-text mb-4">
                The giveaway cannot be cancelled. The funds will be taken upon clicking Publish.
            </div>

            <div class="terms-container mb-2">
                <input type="checkbox" id="platform-terms" v-model="agreeToTerms" class="checkbox-input" />
                <label for="platform-terms" class="checkbox-label">
                    I agree to the Platform Terms & Conditions
                </label>
            </div>

            <div class="terms-container mb-10">
                <input type="checkbox" id="privacy-policy" v-model="agreeToPrivacy" class="checkbox-input" />
                <label for="privacy-policy" class="checkbox-label">
                    I agree to the Privacy Policy
                </label>
            </div>
        </Collapsible>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import Collapsible from './Collapsible.vue';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import { getTokenSymbol, tokenToReadable } from '@/utils/GalaHelper';

const emit = defineEmits(['is-valid']);

const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings, requiredTokenAmount } = storeToRefs(giveawayStore);
const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);

// Get wallet address from profile store
const giveawayWalletAddress = computed(() => {
    return profile.value?.giveawayWalletAddress || 'Not connected';
});

// Get giveaway details from settings
const giveawayTokenAmount = computed(() => {
    // Use a more generic approach since different giveaway types have different property names
    const settings = giveawaySettings.value;
    return (settings as any).tokenQuantity || (settings as any).winPerUser || '0';
});

const startDate = computed(() => {
    return giveawaySettings.value.startDateTime ?
        new Date(giveawaySettings.value.startDateTime).toLocaleDateString() : 'Not set';
});

const endDate = computed(() => {
    return giveawaySettings.value.endDateTime ?
        new Date(giveawaySettings.value.endDateTime).toLocaleDateString() : 'Not set';
});

const token = computed(() => {
    const tokenInfo = giveawaySettings.value.giveawayToken;
    return tokenInfo ? `${tokenInfo.collection}` : 'NFT';
});

const giveawayDuration = computed(() => {
    const start = giveawaySettings.value.startDateTime;
    const end = giveawaySettings.value.endDateTime;

    if (!start || !end) {
        return 'Indefinite';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
});

const requiredTokenQuantityToClaim = computed(() => {
    return giveawaySettings.value.requireBurnTokenToClaim ?
        `${giveawaySettings.value.burnTokenQuantity || '0'} Token(s)` :
        'None';
});

const requiredTokenToClaim = computed(() => {
    return giveawaySettings.value.requireBurnTokenToClaim && giveawaySettings.value.burnToken ?
        `${getTokenSymbol(giveawaySettings.value.burnToken)}` :
        'None';
});

// Terms agreement
const agreeToTerms = ref(false);
const agreeToPrivacy = ref(false);

// Check if ready to publish
const isValid = computed(() => {
    return agreeToTerms.value && agreeToPrivacy.value;
});

// Watch for changes in validity
const checkValidity = () => {
    emit('is-valid', isValid.value);
};

// Watch for changes in terms agreement
watch([agreeToTerms, agreeToPrivacy], () => {
    checkValidity();
});

// Initialize validity check
onMounted(() => {
    checkValidity();
});

defineExpose({ isValid });
</script>

<style scoped>
.explanatory-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
}

.mb-8 {
    margin-bottom: 32px;
}

.mb-4 {
    margin-bottom: 16px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mb-10 {
    margin-bottom: 40px;
}

.mt-10 {
    margin-top: 40px;
}

.summary-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-right: 8px;
    width: 250px;
}

.value {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
}

.warning-text {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 100, 100, 0.9);
    text-align: center;
    padding: 12px;
    background-color: rgba(255, 100, 100, 0.1);
    border-radius: 8px;
    margin: 20px 0;
    border: 1px solid rgba(255, 100, 100, 0.2);
}

.terms-container {
    display: flex;
    align-items: center;
}

.checkbox-input {
    margin-right: 12px;
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.checkbox-label {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
}

:deep(.collapsible-container) {
    margin-bottom: 20px;
}

/* Styling for section titles */
:deep(.collapsible-container h5) {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
}

/* Specific styling for the "Ready to publish" section */
:deep(.collapsible-container:last-child) {
    background-color: rgba(80, 20, 20, 0.2);
    border: 1px solid rgba(236, 100, 100, 0.2);
    margin-top: 32px;
}

:deep(.collapsible-container:last-child h5) {
    color: rgba(255, 120, 120, 0.9);
}

/* Styling for the Publish button */
.PublishButton {
    background-color: white;
    color: black;
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 500;
    margin-top: 16px;
    width: 100%;
    text-align: center;
}

.PublishButton.enabled {
    background-color: #E74C3C;
    color: white;
}

.PublishButton:hover {
    opacity: 0.9;
}
</style>