<template>
    <div class="step-progress">
        <div class="steps-container">
            <!-- The connecting line -->
            <div class="steps-line">
                <div v-for="(step, index) in steps" :key="index" class="line-segment" :style="getLineStyle(index)" />
            </div>
            <!-- The steps themselves -->
            <div class="steps">
                <div v-for="(step, index) in steps" :key="index" class="step" :class="{
                    active: index === currentStep,
                    completed: index < currentStep
                }">
                    <div class="step-circle">
                        <img v-if="index === currentStep" src="@/assets/svgs/selected-step.svg" alt="Step Icon"
                            class="step-icon" />
                        <img v-else src="@/assets/svgs/unselected-step.svg" alt="Step Icon" class="step-icon" />
                    </div>

                    <p :class="index === currentStep ? 'paragraph-small-bold' : 'paragraph-small-regular'">
                        {{ step }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

// Props for the component
const props = defineProps({
    currentStep: {
        type: Number,
        required: true
    },
    steps: {
        type: Array as () => string[],
        required: true
    }
});

// A helper function to calculate the line style based on the current step
const getLineStyle = (index: number) => {
    return {
        width: index < props.currentStep ? '100%' : '0%', // Completed steps have full width
        transition: 'width 0.3s ease-in-out' // Smooth transition for the line progress
    };
};
</script>

<style scoped>
.steps-line {
    position: absolute;
    /* Position it to the center of the parent container */
    left: 0;
    right: 0;
    height: 2px;
    background-color: rgba(236, 236, 236, 0.2);
    z-index: 1;
    margin-bottom: 28px;
}

.step-circle {
    width: 24px;
    /* Circle size */
    height: 24px;
    /* Circle size */
    border-radius: 50%;
    background-color: lightgray;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    margin-bottom: 8px;
    position: relative;
    z-index: 2;
    transition: background-color 0.3s;
}

.step-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    /* Ensure the image fits within the circle without distortion */
}

/* Adjust for any gap between the step and the line if needed */
.steps {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    z-index: 2;
}

.step-progress {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding-top: 20px;
    padding-bottom: 20px;
}

.steps-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}


.line-segment {
    height: 2px;
    background-color: rgba(236, 236, 236, 0.2);
    /* The line color */
}

.step {
    position: relative;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.step-circle {
    width: 24px;
    /* Increased size of circle */
    height: 24px;
    /* Increased size of circle */
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    margin-bottom: 8px;
    position: relative;
    z-index: 2;
    transition: background-color 0.3s;
}

.step-circle.active {
    background-color: blue;
}

.step-circle.completed {
    background-color: green;
}

.step-name {
    font-weight: bold;
    color: white;
    display: block;
    margin-top: 8px;
}
</style>