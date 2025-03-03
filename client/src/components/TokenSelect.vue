<template>
    <div class="token-selection">

        <h5 v-if="!justSelector" style="margin-bottom: 32px;" for="token">Select Giveaway Token<span
                class="required">*</span></h5>
        <ToggleSwitch v-if="!justSelector" v-model:selected="selectedVal" style="margin-bottom: 32px; width: 100%;"
            :options="options">
        </ToggleSwitch>

        <!-- Balances -->
        <div v-if="selectedVal === options[0].key" style="width: 100%;">
            <div v-if="!balances">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div v-else-if="balances.length === 0">
                <p>No current balances</p>
            </div>
            <div v-else v-for="(token, index) in balances" :key="index" class="token-item clickable"
                :class="{ selected: !!giveawaySettings.giveawayToken && checkTokenEquivalancy(giveawaySettings.giveawayToken, token) }"
                @click="() => handleTokenClick(token)">
                <img v-if="getImage(token)" class="token-icon" :src="getImage(token)" alt="token icon" />
                <div v-else class="token-icon-circle"></div>

                <div class="token-details">
                    <div class="token-name paragraph-medium-regular">{{ token.collection }}</div>
                    <div class="token-balance paragraph-small-bold">Balance: {{ token.quantity }}</div>
                </div>

                <div
                    v-if="!!giveawaySettings.giveawayToken && checkTokenEquivalancy(giveawaySettings.giveawayToken, token)">
                    <img src="@/assets/radio-checked.png" alt="Chevron Icon" class="icon" />
                </div>
                <div v-else>
                    <img src="@/assets/radio-unchecked.png" alt="Chevron Icon" class="icon" />
                </div>
            </div>
        </div>

        <div v-if="selectedVal === options[1].key" style="width: 100%;">
            <div v-if="!createdTokens">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div v-else-if="createdTokens.length === 0">
                <v-alert type="info" color="primary" dark>
                    You haven't created any tokens on this wallet. Create one at:
                    <a :href="galaConnectURL" target="_blank" style="color: #ffffff; text-decoration: underline;">Gala
                        Connect</a>
                </v-alert>
            </div>
            <div v-else v-for="(token, index) in balances" :key="index" class="token-item clickable"
                :class="{ selected: !!giveawaySettings.giveawayToken && checkTokenEquivalancy(giveawaySettings.giveawayToken, token) }"
                @click="() => handleTokenClick(token)">
                <img v-if="getImage(token)" class="token-icon" :src="getImage(token)" alt="token icon" />
                <div v-else class="token-icon-circle"></div>

                <div class="token-details">
                    <div class="token-name paragraph-medium-regular">{{ token.collection }}</div>
                    <div class="token-balance paragraph-small-bold">Balance: {{ token.quantity }}</div>
                </div>

                <div
                    v-if="!!giveawaySettings.giveawayToken && checkTokenEquivalancy(giveawaySettings.giveawayToken, token)">
                    <img src="@/assets/radio-checked.png" alt="Chevron Icon" class="icon" />
                </div>
                <div v-else>
                    <img src="@/assets/radio-unchecked.png" alt="Chevron Icon" class="icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, type PropType, type Ref, ref, watch } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import { tokenToReadable, checkTokenEquivalancy } from '@/utils/GalaHelper';
import type { TokenAllowance, TokenBalance, TokenClass } from '@gala-chain/connect';
import type { TokenClassKeyProperties } from '@gala-chain/api';
import type { Transaction } from '@/services/GalaSwapApi';
import { storeToRefs } from 'pinia';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { useProfileStore } from '@/stores/profile';
import { GiveawayTokenType } from '@/utils/types';
const galaConnectURL = import.meta.env.VITE_GALA_CONNECT_URL

const giveawayStore = useCreateGiveawayStore();
const profileStore = useProfileStore();

const { giveawaySettings } = storeToRefs(giveawayStore)
const { profile, isConnected, error, balances, metadata, createdTokens, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)


const props = defineProps({
    justSelector: {
        type: Boolean,
        default: false
    }
})


const options: [
    { key: string; label: string },
    { key: string; label: string }
] = [{ key: GiveawayTokenType.BALANCE, label: "From Balances" }, { key: GiveawayTokenType.ALLOWANCE, label: "From allowances" }]



const selectedVal = computed({
    get: () => giveawayStore.giveawaySettings.giveawayTokenType,
    set: (value: string) => {
        giveawayStore.updateSettings({ giveawayTokenType: value as GiveawayTokenType });
    }
});



const metadataMap = computed(() => {
    const map = new Map<string, TokenClass>();

    if (metadata) {
        metadata.value.forEach(metadata => {
            const key = tokenToReadable(metadata);
            map.set(key, metadata);
        });
    }


    return map;
});



const isValid = computed(() => {
    return !!giveawaySettings.value.giveawayToken;
});

watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});

const getImage = (token: TokenClassKeyProperties) => {
    const tokenClass = metadataMap.value.get(tokenToReadable(token))
    if (tokenClass) {
        return tokenClass.image;
    } else {
        return ''
    }
}


const emit = defineEmits(['update:selectedToken', 'update:selected', 'token-clicked', 'is-valid']);

const handleTokenClick = (token: TokenBalance) => {
    if (giveawaySettings.value.giveawayToken && checkTokenEquivalancy(token, giveawaySettings.value.giveawayToken)) {
        giveawayStore.updateSettings({ giveawayToken: undefined });
    } else {
        giveawayStore.updateSettings({ giveawayToken: token });
    }
    emit('token-clicked', token);
};

defineExpose({ isValid });

</script>

<style scoped>
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

.token-item.clickable {
    cursor: pointer;
}

.token-item:hover {
    background-color: #1f1f1f;
}

.token-item.selected {
    border: none;

    box-shadow: inset 0 0 0 1px #ffffff;
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
    flex-grow: 1;
}

.token-name {
    color: white;
}

.token-balance {
    color: #9E9E9E;
    margin-top: 4px;
}
</style>