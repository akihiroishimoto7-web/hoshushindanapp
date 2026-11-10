import { useToast, SECRETS, secretsOf } from '../game/secrets';
import { useProgress } from '../game/progress';
import { CHAPTERS } from '../game/chapterMeta';

/** 画面の うえに ぽんっと でる おしらせ（ひみつ はっけん・ほめことば） */
export function ToastView() {
  const t = useToast((s) => s.toast);
  if (!t) return null;
  return (
    <div className={`toast ${t.kind}`} key={t.n} data-testid="toast">
      {t.icon && <span className="ic">{t.icon}</span>}
      <span>
        <b>{t.title}</b>
        {t.text && <small>{t.text}</small>}
      </span>
    </div>
  );
}

/** ひみつ ずかん */
export function SecretBook({ onClose }: { onClose: () => void }) {
  const found = useProgress((s) => s.secrets);
  return (
    <div className="screen dim" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>🔍 ひみつ ずかん</h2>
        <p style={{ fontSize: 16 }}>
          おはなしの なかに かくれている ひみつ。 {found.length} / {SECRETS.length} みつけたよ！
        </p>
        <div className="secret-list">
          {CHAPTERS.map((c, i) => (
            <div key={c.id}>
              <div className="secret-ch">
                {c.label} {c.title}
              </div>
              {secretsOf(i).map((s) => {
                const got = found.includes(s.id);
                return (
                  <div key={s.id} className={`secret ${got ? 'got' : ''}`}>
                    <span className="ic">{got ? s.icon : '？'}</span>
                    <span>
                      <b>{got ? s.name : '？？？'}</b>
                      <small>{got ? s.note : `ヒント： ${s.hint}`}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row">
          <button className="btn" onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
