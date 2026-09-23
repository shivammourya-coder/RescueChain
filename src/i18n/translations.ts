export type Language = "en" | "hi";

export interface TranslationStrings {
  appTitle: string;
  tagline: string;
  needHelp: string;
  wantToHelp: string;
  trackHelp: string;
  reportEmergency: string;
  reportSosTab: string;
  trackSosTab: string;
  emergencyDescLabel: string;
  emergencyDescPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  gpsDetecting: string;
  gpsLocked: string;
  dragPinHelp: string;
  submitSos: string;
  submitting: string;
  offlineNoticeTitle: string;
  offlineNoticeDesc: string;
  queuedReportsCount: string;
  syncNow: string;
  keepOtpWarning: string;
  trackingCode: string;
  deliveryOtp: string;
  confidentialOtpNotice: string;
  viewLiveTimeline: string;
  timelineTitle: string;
  urgencyLevel: string;
  category: string;
  peopleAffected: string;
  matchedResource: string;
  assignedVolunteer: string;
  enterTrackingCode: string;
  checkStatus: string;
  recentSosOnDevice: string;
  noRecentSos: string;
  responderLogin: string;
  volunteerDashboard: string;
  availableTasks: string;
  myDispatches: string;
  claimAndDispatch: string;
  pickupProofTitle: string;
  pickupProofDesc: string;
  capturePhoto: string;
  useDemoPhoto: string;
  confirmPickupBtn: string;
  transitTitle: string;
  transitDesc: string;
  startTravelBtn: string;
  handoverOtpTitle: string;
  handoverOtpDesc: string;
  enterOtpPlaceholder: string;
  verifyDeliveryBtn: string;
  verifiedReliefTitle: string;
  verifiedReliefDesc: string;
  rcNumberLabel: string;
  onlyReporterSeeOtp: string;
  invalidOtpError: string;
  heroBadge: string;
  heroTitle: string;
  heroSub: string;
  howItWorks: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    appTitle: "RescueChain",
    tagline: "From Emergency Signal to Verified Relief",
    needHelp: "I Need Help",
    wantToHelp: "I Want to Help",
    trackHelp: "Track My SOS",
    reportEmergency: "Report Emergency SOS",
    reportSosTab: "1. Report New SOS",
    trackSosTab: "2. Track SOS & View OTP",
    emergencyDescLabel: "What is the emergency? (Describe situation, people trapped, immediate needs)",
    emergencyDescPlaceholder: "e.g., Water reached 1st floor, 5 family members trapped on terrace including 1 infant and elderly diabetic patient. Need rescue boat urgently.",
    phoneLabel: "Contact Phone Number (Optional, for responder coordination)",
    phonePlaceholder: "+91 98765 43210",
    gpsDetecting: "Acquiring GPS coordinates...",
    gpsLocked: "Location Pin Locked",
    dragPinHelp: "Drag the pin on the map if your exact location differs.",
    submitSos: "BROADCAST EMERGENCY SIGNAL",
    submitting: "Broadcasting SOS via RescueChain...",
    offlineNoticeTitle: "Device is Offline",
    offlineNoticeDesc: "Don't panic. Your report is saved locally on this phone and will automatically transmit the instant connectivity returns.",
    queuedReportsCount: "reports queued on this device",
    syncNow: "Sync Now",
    keepOtpWarning: "Keep this OTP secret! Only reveal it to the volunteer when physical supplies reach your hands.",
    trackingCode: "Tracking Code",
    deliveryOtp: "Your Handover OTP",
    confidentialOtpNotice: "Confidential Recipient Key. Stored securely only on the reporter's personal device to prevent diversion.",
    viewLiveTimeline: "Follow Live Rescue Chain",
    timelineTitle: "Chain of Custody Timeline",
    urgencyLevel: "Urgency Tier",
    category: "Category",
    peopleAffected: "People Affected",
    matchedResource: "Allocated Relief Inventory",
    assignedVolunteer: "Dispatched Volunteer",
    enterTrackingCode: "Enter RC Tracking Code (e.g., RC-11508)",
    checkStatus: "Check Status & OTP",
    recentSosOnDevice: "Recent SOS Reports from this Phone",
    noRecentSos: "No recent emergency reports found on this device.",
    responderLogin: "Responder Login",
    volunteerDashboard: "Field Volunteer Terminal",
    availableTasks: "Available Rescue Tasks",
    myDispatches: "My Active Dispatches",
    claimAndDispatch: "Claim & Dispatch",
    pickupProofTitle: "Step 1: Secure Relief Goods & Upload Photo",
    pickupProofDesc: "Collect allocated supplies from the depot and snap a verification photo before departing.",
    capturePhoto: "Capture / Upload Photo",
    useDemoPhoto: "Use Demo Relief Photo",
    confirmPickupBtn: "Confirm Supplies Picked Up",
    transitTitle: "Step 2: Depart for Recipient Location",
    transitDesc: "Signal to headquarters and the citizen that you are en route with the relief payload.",
    startTravelBtn: "Start Travel (Mark In Transit)",
    handoverOtpTitle: "Step 3: In-Person Delivery Verification",
    handoverOtpDesc: "Ask the recipient citizen for their secret 4-digit OTP shown on their screen.",
    enterOtpPlaceholder: "4-Digit OTP",
    verifyDeliveryBtn: "Verify OTP & Seal Delivery",
    verifiedReliefTitle: "Relief Chain Verified & Archived",
    verifiedReliefDesc: "Recipient OTP cryptographically certified. Proof of delivery permanently logged.",
    rcNumberLabel: "RC Tracking No.",
    onlyReporterSeeOtp: "Security Rule: The Handover OTP is never revealed to volunteers or public viewers. Only the recipient citizen holds this key.",
    invalidOtpError: "Incorrect recipient verification OTP. Handover denied.",
    heroBadge: "AI-Powered Tactical Disaster Relief Protocol",
    heroTitle: "From Emergency Signal to Verified Relief",
    heroSub: "Turn scattered emergency signals across flood & disaster zones into one coordinated, verified response chain. Works 100% offline in network blackouts.",
    howItWorks: "5-Step Verifiable Coordination Flow"
  },
  hi: {
    appTitle: "रेस्क्यूचेन",
    tagline: "आपातकालीन संकेत से सत्यापित राहत तक",
    needHelp: "मुझे मदद चाहिए",
    wantToHelp: "मैं मदद करना चाहता हूँ",
    trackHelp: "मेरी SOS ट्रैक करें",
    reportEmergency: "आपातकालीन SOS रिपोर्ट करें",
    reportSosTab: "1. नया SOS रिपोर्ट करें",
    trackSosTab: "2. SOS ट्रैक करें और OTP देखें",
    emergencyDescLabel: "आपात स्थिति क्या है? (स्थिति, फंसे लोग और तत्काल जरूरतें बताएं)",
    emergencyDescPlaceholder: "उदा. पहली मंजिल तक पानी भर गया है, छत पर 5 लोग फंसे हैं जिसमें एक छोटा बच्चा और बुजुर्ग मरीज शामिल हैं। नाव की तुरंत जरूरत है।",
    phoneLabel: "संपर्क फोन नंबर (वैकल्पिक, स्वयंसेवक से समन्वय हेतु)",
    phonePlaceholder: "+91 98765 43210",
    gpsDetecting: "जीपीएस लोकेशन पहचानी जा रही है...",
    gpsLocked: "स्थान पिन लॉक हो गया",
    dragPinHelp: "यदि आपका सटीक स्थान अलग है तो मानचित्र पर पिन को खिसकाएं।",
    submitSos: "आपातकालीन सिग्नल प्रसारित करें",
    submitting: "रेस्क्यूचेन पर SOS भेजा जा रहा है...",
    offlineNoticeTitle: "डिवाइस ऑफलाइन है",
    offlineNoticeDesc: "घबराएं नहीं। आपकी रिपोर्ट आपके फोन में सुरक्षित है और इंटरनेट आते ही स्वतः भेज दी जाएगी।",
    queuedReportsCount: "रिपोर्ट इस फोन में कतारबद्ध हैं",
    syncNow: "अभी सिंक करें",
    keepOtpWarning: "यह OTP पूरी तरह गुप्त रखें! इसे केवल तभी बताएं जब राहत सामग्री वास्तव में आपके हाथों में पहुंच जाए।",
    trackingCode: "ट्रैकिंग कोड",
    deliveryOtp: "आपका हैंडओवर OTP",
    confidentialOtpNotice: "गोपनीय नागरिक कुंजी। सुरक्षा हेतु यह केवल रिपोर्टर के व्यक्तिगत फोन पर ही दिखाई देती है।",
    viewLiveTimeline: "लाइव राहत प्रगति देखें",
    timelineTitle: "राहत प्रगति समयरेखा",
    urgencyLevel: "आपात स्तर",
    category: "श्रेणी",
    peopleAffected: "प्रभावित लोग",
    matchedResource: "आवंटित राहत सामग्री",
    assignedVolunteer: "तैनात स्वयंसेवक",
    enterTrackingCode: "RC ट्रैकिंग कोड दर्ज करें (उदा. RC-11508)",
    checkStatus: "स्थिति और OTP जांचें",
    recentSosOnDevice: "इस फोन से भेजी गई हालिया SOS रिपोर्टें",
    noRecentSos: "इस डिवाइस पर कोई हालिया रिपोर्ट नहीं मिली।",
    responderLogin: "स्वयंसेवक / अधिकारी लॉगिन",
    volunteerDashboard: "फील्ड वालंटियर टर्मिनल",
    availableTasks: "उपलब्ध राहत कार्य",
    myDispatches: "मेरी सक्रिय डिलीवरी",
    claimAndDispatch: "स्वीकार करें व रवाना हों",
    pickupProofTitle: "चरण 1: राहत सामग्री प्राप्त करें और फोटो अपलोड करें",
    pickupProofDesc: "डिपो से आवंटित राहत सामग्री लें और प्रस्थान से पहले सत्यापन फोटो खींचें।",
    capturePhoto: "फोटो खींचें / अपलोड करें",
    useDemoPhoto: "डेमो राहत फोटो उपयोग करें",
    confirmPickupBtn: "सामग्री पिकअप की पुष्टि करें",
    transitTitle: "चरण 2: नागरिक के स्थान के लिए रवाना हों",
    transitDesc: "कमांड सेंटर और नागरिक को सूचित करें कि आप राहत सामग्री लेकर निकल चुके हैं।",
    startTravelBtn: "यात्रा शुरू करें (रास्ते में चिह्नित करें)",
    handoverOtpTitle: "चरण 3: व्यक्तिगत डिलीवरी सत्यापन (OTP)",
    handoverOtpDesc: "नागरिक से उनके फोन स्क्रीन पर दिख रहा 4 अंकों का गुप्त OTP पूछें।",
    enterOtpPlaceholder: "4-अंक OTP",
    verifyDeliveryBtn: "OTP सत्यापित करें और डिलीवरी सील करें",
    verifiedReliefTitle: "राहत श्रृंखला सत्यापित और सुरक्षित",
    verifiedReliefDesc: "नागरिक OTP द्वारा प्रमाणित। डिलीवरी का डिजिटल प्रमाण स्थायी रूप से दर्ज हो गया।",
    rcNumberLabel: "RC ट्रैकिंग नंबर",
    onlyReporterSeeOtp: "सुरक्षा नियम: हैंडओवर OTP स्वयंसेवकों या जनता को नहीं दिखाया जाता। यह केवल पीड़ित नागरिक के फोन पर रहता है।",
    invalidOtpError: "गलत सत्यापन OTP! डिलीवरी अस्वीकार कर दी गई।",
    heroBadge: "AI-संचालित सामरिक आपदा राहत प्रोटोकॉल",
    heroTitle: "आपातकालीन संकेत से सत्यापित राहत तक",
    heroSub: "बाढ़ और आपदा क्षेत्रों में बिखरे संकट सिग्नलों को एक समन्वित, सत्यापित राहत श्रृंखला में बदलें। नेटवर्क न होने पर भी 100% ऑफलाइन कार्य करता है।",
    howItWorks: "5-चरणीय सत्यापन योग्य समन्वय प्रक्रिया"
  }
};
