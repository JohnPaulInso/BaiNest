import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN4f7W8vU8te3bf9s123IsdrZq6yfu4wU",
  authDomain: "bainest-1.firebaseapp.com",
  projectId: "bainest-1",
  storageBucket: "bainest-1.firebasestorage.app",
  messagingSenderId: "803797867978",
  appId: "1:803797867978:web:29fe06bc4803caa0ff4333",
  measurementId: "G-JN01VZRMZD",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const tags = [
  "Affiliate Marketing",
  "alert",
  "Applepay",
  "Bogo Cebu",
  "Bogo City",
  "Bogo Lifestyle",
  "Bogo Photo Feature",
  "Bogo Places",
  "Bogo Spots",
  "BOGOHANON CHECK-IN",
  "Bogophoria",
  "Bogophoria list",
  "Business Buzz",
  "Capitancillo",
  "Community",
  "Content Creation",
  "Culture & Community",
  "Cycling Apparel",
  "Facebook Tips",
  "Fact Check",
  "Family & Kids",
  "Food & Drinks",
  "forthesoul",
  "Free Diving",
  "Fun Activities",
  "greetings",
  "Hometown Heroes",
  "Hot Topic",
  "Hotspot",
  "In Focus",
  "Local Businesses",
  "Local Heroes",
  "News & Updates",
  "People",
  "Places",
  "Politics",
  "Prince Express Inn",
  "Public Safety",
  "Red Goose",
  "Red Goose Bogo City",
  "Social Media",
  "Sports",
  "Stories",
  "The Bogohanon Spirit",
  "Things to Do",
  "tips",
  "Top 10 things to experience in Bogo City",
  "Unfiltered",
  "Wakal-Wakal"
];

async function main() {
  console.log("Importing", tags.length, "tags to Firestore...");
  // Save to settings/global
  await setDoc(doc(firestore, "settings", "global"), { tags }, { merge: true });
  // Save to settings/taxonomy
  await setDoc(doc(firestore, "settings", "taxonomy"), { tags, updatedAt: new Date().toISOString() }, { merge: true });
  console.log("Successfully imported all tags to Firestore!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to import tags:", err);
  process.exit(1);
});
