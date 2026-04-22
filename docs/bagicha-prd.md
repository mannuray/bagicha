# Product Requirements Document (PRD): Bagicha App

## 1. Overview & Vision
"Bagicha" is a localized, intelligent garden and orchard management system designed to eliminate guesswork in horticultural care. Moving beyond simple reminders, Bagicha integrates hyper-local data, voice interaction, and event-driven physical subscriptions. It transforms the act of gardening into a data-backed, zero-guesswork experience, while honoring the emotional legacy of long-term planting (e.g., family orchards).

## 2. Target Audience
- Serious home gardeners and small-scale orchard owners (specifically in the Indian context, e.g., managing Mango, Litchi, or Lemon trees).
- Users managing seasonal vegetable patches who need dynamic rotation planning.
- Gardeners looking for localized, vernacular-first advice and automated supply fulfillment.

## 3. Core Modules

### 3.1. The Tree Ledger (Infrastructure Layer)
- **Persistent Inventory:** Users log permanent assets (e.g., Mango, Litchi, Lemon trees).
- **Health Profiles:** Track tree age, specific variety (e.g., Jardalu, Langra), and historical yields.
- **Perennial Care Scheduler:** Automated, critical schedules for low-frequency events like deep-feeding (NPK/Micronutrients) and seasonal pruning to maximize fruit-bearing.

### 3.2. The Seasonal Engine (Agile Layer)
- **Crop Rotation Planner:** Manages seasonal vegetable patches. Automatically transitions the app's state based on seasons (e.g., switching from Winter Peas/Carrots to Summer Gourds/Okra).
- **Dynamic Reminders:** Integrates with Hyperlocal Weather APIs to trigger urgent alerts (e.g., "Heatwave forecast for Bihar: Deep-water your citrus trees tonight").

### 3.3. The Fulfillment Loop (Physical Layer)
- **Event-Driven Subscription:** Replaces generic monthly boxes with state-triggered fulfillment.
- **Contextual Kits:** If the app detects June approaching, it automatically triggers a "Monsoon Shield Kit" (organic fungicides, nitrogen boosters) delivery for the user's specific plant inventory.

## 4. Technical Edge (The Developer Advantage)

### 4.1. Vision-Based Diagnosis
- Integration of a Computer Vision model (e.g., TensorFlow Lite or Plantix API) allowing users to snap photos to instantly diagnose pests (Mealybugs, Leaf Curl) and diseases.

### 4.2. Voice Interface (Vernacular First)
- Integration with the Bhashini API to provide seamless vernacular voice interaction.
- Example Use Case: A user asks in Hindi, "Aj gobhi lagane ka sahi time hai?" (Is it the right time to plant cauliflower today?), and receives a data-backed, spoken response.

## 5. User Experience (UX) Philosophy
- **Zero-Guesswork:** The user never has to decide what to buy. The app dictates action based on garden state and location.
- **Legacy Tracking & Memory Reminders:** A timeline for long-lived trees. The app sends emotional hooks (e.g., "5 years since you planted this for your daughter's birthday") to encourage growth photos and long-term engagement.
- **Sustenance Score (Gamification):** Users earn "Sustenance Points" for organic practices, logging compost, or helping in the community. High points increase their **Ranking** (e.g., "Seedling" -> "Master Orchardist"), unlocking prestige and expert status, but **no monetary discounts**.
- **Offline First:** The Tree Ledger, basic care guides, and the Seasonal Engine must work without a data connection. Data syncs when back on Wi-Fi/4G, crucial for rural or large orchards.

## 6. Proposed Roadmap

- **Phase 1 (MVP):** Tree & Perennial Inventory + Weather Reminders + Basic Community Feed + **Offline Mode** + **Ranking System** + **Memory Reminders**.
- **Phase 2 (Scale):** 
  - **The Academy:** Bite-sized video guides (60-second shorts) for pruning/care.
  - **The Nursery & Tool Marketplace:** A B2C platform connecting users with local and online nurseries for high-quality saplings, trees, and professional-grade gardening tools (shovels, pruning shears, automated irrigation kits).
  - **Subscription Engine:** Contextual Kits delivery (Shiprocket/DeHaat).
- **Phase 3 (AI & Vision):** AI Diagnostic Tool + Bhashini Voice Integration. Future consideration: C2C surplus produce marketplace.

## 7. Recommended Technology Stack
- **Frontend Framework:** React Native or Flutter (Native Camera, Microphone, and **SQLite/WatermelonDB for Offline Storage**).
- **Backend:** Node.js or Go for event-driven scheduling.
- **Database:** PostgreSQL + Redis for caching.
- **Integrations:**
  - Weather API (Hyperlocal)
  - Bhashini API (Voice/Vernacular)
  - Plantix API / TFLite (Vision)
  - Logistics API (Shiprocket/DeHaat)

## 8. Monetization & Subscription Strategy

### 8.1. The "Seasonal Seed & Care" Subscription (Physical)
- **Model:** Event-driven, seasonal delivery (Kits vs. Custom Box).
- **Subscription Cycle:** Opt-in for categories (Veggie, Flower, or Both).

### 8.2. "Bagicha Premium" (Digital Services)
To manage high operational costs (AI/Experts), a tiered digital subscription:
- **Free Tier:** Up to 3 trees, basic weather alerts, read-only community.
- **Premium Tier:** Unlimited Tree Ledger, Full AI Diagnosis, AI Tree Mentor, Expert Chat, and full community posting rights. **Note:** High community ranking does NOT provide discounts, only expert prestige.
