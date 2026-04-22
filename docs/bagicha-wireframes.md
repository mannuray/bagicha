# Bagicha App - Wireframes & User Journey

## Core User Journeys
1. **Onboarding & Setup:** Personalizing the app based on language, location, and garden type.
2. **Daily Zero-Guesswork Check-in:** Reviewing the dashboard for immediate actions triggered by the Seasonal Engine.
3. **Managing the Tree Ledger:** Adding a new permanent asset (tree) and viewing its legacy timeline.
4. **Pest & Disease Diagnosis:** Using the camera to identify issues.
5. **Community & Mentorship:** Getting local, expert-verified advice and participating in direct chat.

## Screen Breakdown (Draft)

### 1. Onboarding Flow
- **Screen 1.1: Language Selection:** Prominent, vernacular-first selection (English, Hindi, etc.).
- **Screen 1.2: Location Setup:** Pincode/District entry for Hyperlocal weather and seasonal data.
- **Screen 1.3: Garden Profile:** "What are you growing?" (Multi-select checkboxes: Fruit Trees, Seasonal Vegetables, Flowers). User can tick multiple options to personalize their dashboard.

### 2. Main Dashboard (Home)
- **Header:** Current weather icon, localized temperature (e.g., "Patna • 34°C ☀️"), and a profile icon for settings/language selection.
- **Priority Zone (Urgent Action Card):** Standout card appearing only for critical alerts (e.g., "Heatwave Alert: Deep-water your 5-year-old Mango tree tonight"). Includes a clear "Done" or "I'll do it later" action.
- **Daily Docket (Today's Tasks):** Auto-generated vertical list of tasks based on the Garden Profile and Tree Ledger (e.g., "Prune lower branches of Lemon tree", "Sow summer gourds"). Checking a box records the action.
- **Quick Action (FAB):** Floating Action Button to quickly add a new Tree Ledger entry, log a Harvest, or ask a question in the Community.
- **Bottom Navigation:** Home, Ledger, Scan (Camera), Community (The Green Room).

### 3. The Tree Ledger (Infrastructure Layer)
- **Screen 3.1: Inventory List View:** 
  - Visual grid or list of all permanent assets (e.g., Mango, Litchi, Lemon).
  - High-level health status indicators (e.g., Green = Healthy, Yellow = Needs Feeding).
  - Floating "Add Tree/Asset" button.
- **Screen 3.2: Tree Detail View (Legacy & Lifecycle):** 
  - **Hero Section:** Large photo of the tree, Name, Age, Variety, and Type (Fruit Bearing vs. Non-Fruit Bearing/Ornamental).
  - **Current Lifecycle Stage:** A prominent visual indicator showing the tree's current phase (Sapling, First Flowering, Mature/Bearing).
  - **Year-Round Maintenance Ring:** A circular timeline showing the annual care cycle tailored to the *current* lifecycle stage.
  - **Harvest Log (Conditional):** If the tree is marked as 'Fruit Bearing', a dedicated tab/section allowing users to log the weight/count of their seasonal harvest. Displays historical yield charts (e.g., 2024: 50kg).
  - **Pest & Treatment History:** A dedicated log of past pest/disease diagnoses (from the Vision tool) and the treatments applied, serving as a medical history for the tree.
  - **Legacy Timeline:** A chronological scroll of notes and photos documenting the tree's growth since planting.
- **Screen 3.3: Add New Tree Flow:**
  - **Step 1:** Select Type: "Fruit/Nut Bearing" (e.g., Mango, Litchi) or "Non-Fruit/Ornamental" (e.g., Neem, Ashoka).
  - **Step 2:** Select Species & Variety (e.g., Mango -> Langra).
  - **Step 3:** Enter planting date/age and upload the first photo.

### 4. Vision (Scan)
- **Screen 4.1: Camera View (Dual Mode):** 
  - **Interface:** Full-screen viewfinder. A subtle, animated scanning frame guides the user.
  - **Mode Toggle:** A prominent toggle switch at the bottom or top: "Diagnose (Health)" vs. "Identify (Discovery)".
  - **Controls:** "Snap" button, Flash toggle, and Gallery upload icon.
  - **Contextual Help:** Changes based on mode (e.g., "Focus on the sick leaf" vs. "Capture the whole plant or flower").
- **Screen 4.2: Analyzing State:** 
  - **Visual:** The captured photo dims, and a scanning animation plays.
  - **Text:** Adapts to the mode (e.g., "Checking for pests..." vs. "Identifying species...").
- **Screen 4.3: Result View - Diagnosis Mode:** 
  - **Header:** Uploaded image with bounding boxes highlighting issues.
  - **Diagnosis Card:** Specific pest/disease and Severity Indicator (Low/Medium/High).
  - **Action Plan:** Immediate and Long-term steps (Zero-Guesswork).
  - **Integration:** "Log to Tree Ledger" or "Order Treatment Kit".
- **Screen 4.4: Result View - Identify Mode (Discovery):**
  - **Header:** Uploaded image.
  - **Plant Profile Card:** Common Name, Scientific Name, and brief description.
  - **Care Summary:** High-level overview of sunlight, water, and soil needs.
  - **Action:** "Save to Wishlist" or "Add to Bagicha" (if they brought a cutting/sapling home).

### 5. Community Forum & Chat (The Green Room)
- **Screen 5.1: Main Feed (Hyper-Local):**
  - **Toggle:** "My District" vs. "All India". Default is local for relevant seasonal issues.
  - **Community Alert Banner (Pest Radar):** Prominent banner aggregated from local users (e.g., "🚨 5 users in your district reported Mealybugs this week. Check your citrus trees.").
  - **Post Cards:** Clean cards showing user questions, harvest brags, or warnings. Badges indicate the user's experience level (e.g., "Master Orchardist").
- **Screen 5.2: Create a Post:**
  - **Options:** Attach a photo, link a specific tree from the Ledger, or attach an AI Diagnosis for a second opinion.
  - **Voice-to-Text Input:** Uses OS-level voice dictation (or Bhashini) for easy, vernacular-first typing directly from the garden.
- **Screen 5.3: Q&A / Expert Verification:**
  - **Format:** Reddit-style upvoting for best answers.
  - **Expert Tags:** Verified agronomists or highly-rated local users have a distinct visual tag, ensuring reliable, "zero-guesswork" advice.
- **Screen 5.4: Direct Messaging & Chat:**
  - **Inbox List:** View ongoing direct chats with local experts, agronomists, or neighbors.
  - **Chat Interface:** Standard messaging UI (WhatsApp style) allowing users to share Ledger links, AI scan results, or photos directly in private. Useful for arranging seed swaps or deep-diving into specific plant issues one-on-one.
- **Screen 5.5: AI Tree Assistant (The AI Mentor):**
  - **Interface:** A specialized, permanent chat thread with "Bagicha AI."
  - **Leveraged Intelligence:** The AI indexes the user's specific **Tree Ledger** context (age, species, health history) and cross-references it with **Community Wisdom** (expert-verified answers, local pest outbreaks, and high-yield success stories from "The Green Room").
  - **Zero-Guesswork Answers:** Provides immediate, localized advice (e.g., "3 experts in Bihar suggest pruning your Mango tree this week due to the early monsoon forecast. Your 5-year-old tree is at the perfect stage for this.")
  - **Community Citations:** Every AI answer includes "Read more from the community" links to the actual forum posts it's citing, building trust and encouraging further forum engagement.
  - **Actionable Handover:** If the AI can't solve a problem, it offers a "Connect with an Expert" button to start a human chat in Screen 5.4.

### 6. Subscription Paywalls (Upsell Logic)
- **Screen 6.1: "Bagicha Premium" Paywall:**
  - **Visual:** Minimalist, high-quality photo of a lush orchard.
  - **Value Proposition:** "Save Your Harvest with Bagicha Premium."
  - **Benefits List:** Unlimited AI Tree Mentor, Full Disease Diagnosis, Expert Verification, and Unlimited Tree Ledger.
  - **Pricing:** Clear "Monthly" vs. "Annual" toggle (Annual offered with a discount).
- **Triggers (When to show the Paywall):**
  - **Tree Ledger:** When a user attempts to add their 4th tree/asset.
  - **Vision Scan:** After the user exceeds their weekly "Diagnose Mode" limit (Identity Mode remains free).
  - **AI Chat:** Before initiating the first query with the **AI Tree Assistant** (Screen 5.5).
  - **Community:** When a user attempts to post or comment in "The Green Room."
- **Screen 6.2: "Contextual Kit" Order/Subscription:**
  - **Visual:** Image of the "Kit" (e.g., seeds, organic fertilizers).
  - **Trigger:** Automatic pop-up when the Seasonal Engine detects a transition (e.g., "The Monsoon is coming. Get your Monsoon Shield Kit delivered by tomorrow.").
  - **Action:** A single "Subscribe & Deliver" button for seamless physical fulfillment.

### 8. The Nursery & Tool Marketplace (Phase 2)
- **Screen 8.1: Marketplace Categories:**
  - **The Orchard Shop:** Verified saplings and trees (Mango, Litchi, etc.) from local and partner nurseries.
  - **The Tool Shed:** High-quality gardening equipment (Pruning shears, digging tools, automated watering kits).
  - **Soil & Care:** Professional fertilizers, organic compost, and pest control (beyond what's in the subscription kits).
- **Screen 8.2: Product Detail (The "Legacy" Link):**
  - **For Saplings:** Shows the tree's variety, expected growth height, and future yield potential. A single button: "Buy & Add to My Ledger" which pre-fills a tree entry.
  - **For Tools:** High-quality images, video demos (from the Academy), and user ratings.
- **Screen 8.3: Local Nursery Finder:**
  - Map view or list of verified nurseries in the user's district for self-pickup or fast local delivery.

### 9. Engagement & Gamification
- **Screen 9.1: Memory Reminder (Push & In-App):**
  - **Visual:** "5 years ago today..." with an old photo of the tree.
  - **Action:** "Take a progress photo today" to update the Legacy Timeline.
- **Screen 9.2: Sustenance Score Profile:**
  - **Visual:** A progress bar showing points earned for organic farming, community help, and composting.
  - **Ranking:** Clear badge showing current rank (e.g., "Seedling," "Rooted," "Master Orchardist"). This rank is the primary "prestige" in the Green Room community.

### 7. Seed Store & Subscription Management
- **Screen 7.1: The Seasonal Store:**
  - **Header:** "Your Summer Garden Prep." A countdown to the next planting window (e.g., "Planting starts in 15 days").
  - **Main Options:** 
    - **"Expert Prepackaged Kits":** Curated bundles (e.g., "Patna Summer Veggie Box"). Shows contents: Cucumber, Gourd, Okra seeds + organic fertilizer.
    - **"Build Your Own Box":** A grid of individual seed packets. 
  - **The "Smart-Add" Tool:** If a user selects "Tomato," the app highlights "Marigolds" as a recommended companion plant.
- **Screen 7.2: Custom Box Builder:**
  - **Visual:** A "virtual box" at the bottom that fills up as the user selects seeds. 
  - **Constraint Checker:** "Your box has 5/8 seed packets." Encourages full utilization of shipping capacity.
- **Screen 7.3: Subscription Status:**
  - **Details:** Manage active seasonal subscriptions (e.g., "Vegetable Kit: Active," "Flower Kit: Paused").
  - **Timeline:** Future delivery dates (e.g., "Monsoon Prep arriving in June").

