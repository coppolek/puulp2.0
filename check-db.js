import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-flowblog-755e4759-e218-40e2-bd33-595255596e9c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, "articles"));
  let errors = 0;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.content !== 'string') {
      console.log(`Doc ${doc.id} has invalid content:`, typeof data.content, data.content);
      errors++;
    }
    if (typeof data.title !== 'string') {
      console.log(`Doc ${doc.id} has invalid title:`, typeof data.title, data.title);
      errors++;
    }
  });
  console.log(`Done checking articles. Found ${errors} errors.`);
  process.exit(0);
}
check();
