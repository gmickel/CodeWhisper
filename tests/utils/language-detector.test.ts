import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../../src/utils/language-detector';

describe('language-detector', () => {
  it('should detect JavaScript', () => {
    expect(detectLanguage('file.js')).toBe('javascript');
  });

  it('should detect TypeScript', () => {
    expect(detectLanguage('file.ts')).toBe('typescript');
  });

  it('should detect Python', () => {
    expect(detectLanguage('script.py')).toBe('python');
  });

  it('should detect Ruby', () => {
    expect(detectLanguage('app.rb')).toBe('ruby');
  });

  it('should detect Java', () => {
    expect(detectLanguage('Main.java')).toBe('java');
  });

  it('should detect Go', () => {
    expect(detectLanguage('server.go')).toBe('go');
  });

  it('should detect Rust', () => {
    expect(detectLanguage('lib.rs')).toBe('rust');
  });

  it('should detect HTML', () => {
    expect(detectLanguage('index.html')).toBe('html');
  });

  it('should detect CSS', () => {
    expect(detectLanguage('styles.css')).toBe('css');
  });

  it('should return plaintext for unknown extensions', () => {
    expect(detectLanguage('file.xyz')).toBe('plaintext');
  });
});
