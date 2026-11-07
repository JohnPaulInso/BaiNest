// Phase 7 stub. Same methods as LocalAdapter. Mapping:
// get -> getDoc | list -> getDocs(query(where, orderBy, limit)) | create -> setDoc | update -> updateDoc
// remove -> deleteDoc | subscribe -> onSnapshot | exportAll/importAll -> migration script
const todo = () => { throw new Error('FirebaseAdapter is not implemented yet (Phase 7).'); };
export class FirebaseAdapter {
  open() { todo(); } get() { todo(); } list() { todo(); } create() { todo(); }
  update() { todo(); } remove() { todo(); } subscribe() { todo(); } exportAll() { todo(); } importAll() { todo(); }
}
