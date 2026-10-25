/** Web Storage 인터페이스의 메모리 구현(테스트용). broken=true 면 모든 쓰기·읽기가 예외(사파리 개인정보 보호 모드 흉내). */
export class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  constructor(private broken = false) {}
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    if (this.broken) throw new Error("SecurityError");
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.broken) throw new Error("QuotaExceededError");
    this.map.set(key, String(value));
  }
}
