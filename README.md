# 💖 TogetherMiles – A Romantic web for Couples

TogetherMiles is a couple-focused mobile application designed to help partners connect, communicate, play, and grow together — no matter the distance. The app provides a secure and private space where couples can chat, share memories, play games, and support each other emotionally.
TogetherMiles combines technology with love to strengthen relationships.

---

## 🌟 Key Features

### 🔐 Couple Signup & Unique ID System
The first partner signs up by entering a username, nickname, phone number, and role (girl/boy). After submission, the app automatically generates a unique Couple ID, which is shared with the second partner.

The second partner joins using the Couple ID. If the couple slot is empty, the partner is allowed to join. If two users are already linked, further access is blocked. Once joined, both partners are permanently connected.

---

### 🔑 Secure Login
Users can log in using their username and Couple ID. No email is required. Google Sign-In is available as an optional feature through Firebase Authentication.

---

### 💓 Romantic Heartbeat Login Animation
After successful login, a romantic animation plays where both partner icons move toward each other, meet at the center, and a beating heart appears before redirecting to the dashboard.

---

### 💬 Real-Time Private Chat
Couples can chat securely using real-time messaging powered by Firebase Firestore. Messages are delivered instantly with SMS-style chat bubbles, nicknames displayed, auto-scroll enabled, and recent chats stored safely. All conversations are completely private and visible only to the connected couple.

---

### 🔔 Push Notifications
Real-time push notifications are implemented using Firebase Cloud Messaging (FCM). When one partner sends a message, the other partner receives an instant notification, even if the app is closed. Notification permission is requested after login.

---

### 🎨 Romantic UI Design
The app features a mobile-first romantic UI with pink and purple gradient themes, rounded chat bubbles, smooth transitions, heartbeat loaders, and a clean, modern design focused on user comfort.

---

### 🎮 Truth or Dare Game
Couples can play Truth or Dare together in real time. Answers are instantly visible to the partner. Users can also add custom questions, and notifications are sent when a partner responds.

---

### 🖼️ Private Gallery
Partners can upload photos to a private gallery stored securely in Firebase Storage. Images are visible only to the couple and remain safe even if deleted from the device.

---

### 📸 Snap Moment (Story Feature)
Users can upload instant images as stories and choose visibility options: visible to both partners or visible to only one partner. Stories can be viewed in a story-style format.

---

### 📝 Couple Future To-Do List
Couples can create a shared future to-do list by adding places they want to visit together. Items can be marked as visited or cancelled, helping couples plan and track their shared goals.

---

### 📖 Digital Relationship Diary
A digital diary allows couples to record special memories. Entries can be set as visible to both partners or kept private as “only me,” preserving emotional moments.

---

## 💎 Premium Counseling Feature
TogetherMiles also provides optional premium counseling support for couples facing communication gaps, misunderstandings, or relationship challenges. Couples can choose voice or video counseling sessions to talk, understand each other better, and grow together(not yet completly implemented).

### 💰 Payment Plans
- Voice Call – ₹50  
- Video Call – ₹100  

Payments are handled securely using UPI.

UPI ID:
