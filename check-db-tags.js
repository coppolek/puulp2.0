import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0078533526",
  appId: "1:956205630002:web:af2dab8c20ff8c8d0e322b",
  apiKey: "AIzaSyBO2QV3bjv7WrjMF5gUw2lhbxSWQBGYsHs",
  authDomain: "gen-lang-client-0078533526.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-flowblog-755e4759-e218-40e2-bd33-595255596e9c");

async function check() {
  const querySnapshot = await getDocs(collection(db, "articles"));
  let errors = 0;
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    let hasError = false;
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach(tag => {
        if (typeof tag !== 'string') {
          console.log(`Doc ${docSnap.id} has invalid tag type:`, typeof tag, tag);
          hasError = true;
          errors++;
        }
      });
    }
    if (typeof data.content !== 'string') {
        console.log(`Doc ${docSnap.id} has invalid content:`, typeof data.content);
        hasError = true;
    }
    if (typeof data.title !== 'string') {
        console.log(`Doc ${docSnap.id} has invalid title:`, typeof data.title);
        hasError = true;
    }
    if (hasError) {
        // Uncomment to delete bad data
        await deleteDoc(doc(db, "articles", docSnap.id));
        console.log(`Deleted doc ${docSnap.id}`);
    }
  }
  console.log(`Done checking. Found ${errors} errors.`);
  process.exit(0);
}
check();
