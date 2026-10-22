<script setup lang="ts">
import { FaqSection } from '@/widgets/faq'
import { FormatsSection } from '@/widgets/formats-overview'
import { HowItWorksSection } from '@/widgets/how-it-works'
import { HeroSection } from '@/widgets/landing-hero'
import { PromisesSection } from '@/widgets/promises'
import { SafetySection } from '@/widgets/safety'
import { SupportSection } from '@/widgets/support'
</script>

<template>
  <main id="content">
    <HeroSection />
    <HowItWorksSection />
    <FormatsSection />
    <PromisesSection />
    <SafetySection />
    <FaqSection />
    <SupportSection />
  </main>
</template>
