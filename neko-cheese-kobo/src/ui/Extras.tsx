import { useProgress, type Player } from '../game/progress';
import { playSfx } from '../audio/sfx';

/** 主人公の いろ */
export const DRESS_COLORS = ['#ffd24a', '#ff9fb4', '#8ccaf5', '#9ad9b0', '#c3a8f0', '#f26b6b'];
export const HAIR_COLORS = ['#7a4526', '#2b1d16', '#b97a45', '#e3b866'];
const STYLES: { id: Player['style']; label: string }[] = [
  { id: 'twin', label: 'ふたつむすび' },
  { id: 'pony', label: 'ポニーテール' },
  { id: 'short', label: 'ショート' },
];

/** 「わたし」: なまえ・ふく・かみを えらぶ（タイトルの 女の子が その場で かわる） */
export function PlayerPanel({ onClose }: { onClose: () => void }) {
  const player = useProgress((s) => s.player);
  const setPlayer = useProgress((s) => s.setPlayer);
  return (
    <div className="screen me-screen" onClick={onClose}>
      <div className="card outfit-card" onClick={(e) => e.stopPropagation()}>
        <h2>👧 わたし</h2>
        <div className="label">なまえ（ミルクが よんで くれるよ）</div>
        <input
          className="name-input"
          value={player.name}
          maxLength={8}
          placeholder="ひらがなで かいてね"
          inputMode="text"
          autoComplete="off"
          data-testid="name"
          onChange={(e) => setPlayer({ name: e.target.value.replace(/\s/g, '').slice(0, 8) })}
        />
        <div className="label">ふくの いろ ・ かみの いろ</div>
        <div className="swatches">
          {DRESS_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${player.dress === c ? 'on' : ''}`}
              style={{ background: c }}
              aria-label="ふくの いろ"
              onClick={() => {
                setPlayer({ dress: c });
                playSfx('pop');
              }}
            />
          ))}
        </div>
        <div className="swatches">
          {HAIR_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${player.hair === c ? 'on' : ''}`}
              style={{ background: c, borderRadius: 10 }}
              aria-label="かみの いろ"
              onClick={() => {
                setPlayer({ hair: c });
                playSfx('pop');
              }}
            />
          ))}
        </div>
        <div className="label">かみがた</div>
        <div className="choice-row">
          {STYLES.map((st) => (
            <button
              key={st.id}
              className={`btn sub ${player.style === st.id ? 'on' : ''}`}
              data-testid={'style-' + st.id}
              onClick={() => {
                setPlayer({ style: st.id });
                playSfx('ting');
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="row">
          <button className="btn" onClick={onClose}>
            これで いく！
          </button>
        </div>
      </div>
    </div>
  );
}

/** つくった チーズの ずかん（3しゅるい あつめよう） */
const MADE = [
  {
    id: 'soft',
    icon: '🥛',
    name: 'やわらかい チーズ',
    note: 'しろカビで とろーり。 カマンベールの なかま。',
    how: 'カードを おおきめに きって、 「おさないで まつ」を えらぼう',
  },
  {
    id: 'semi',
    icon: '🧀',
    name: 'ほどよい かたさの チーズ',
    note: 'もちっと やさしい あじ。 ゴーダの なかま。',
    how: 'カードを こまかく しすぎないで、 すこしだけ おそう',
  },
  {
    id: 'hard',
    icon: '🪨',
    name: 'かたい チーズ',
    note: 'ぎゅっと しまって こくが ある。 チェダーの なかま。',
    how: 'カードを こまかく きって、 ぎゅーっと ながく おそう',
  },
];

export function CheeseBook({ onClose }: { onClose: () => void }) {
  const made = useProgress((s) => s.made);
  const all = MADE.every((m) => made.includes(m.id));
  return (
    <div className="screen dim" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>🧀 チーズずかん</h2>
        <p style={{ fontSize: 15 }}>
          {all ? '3しゅるい ぜんぶ つくった！ チーズはかせ だね！' : `つくった チーズ ${made.length} / 3。 だい4しょうで ちがう つくりかたを ためしてみよう！`}
        </p>
        <div className="made-list">
          {MADE.map((m) => {
            const got = made.includes(m.id);
            return (
              <div key={m.id} className={`made ${got ? 'got' : ''}`}>
                <span className="ic">{got ? m.icon : '？'}</span>
                <span>
                  <b>{got ? m.name : '？？？'}</b>
                  <small>{got ? m.note : `つくりかたの ヒント： ${m.how}`}</small>
                </span>
              </div>
            );
          })}
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

/**
 * おうちで やってみよう: 牛乳と レモン汁で つくる かんたんな チーズ。
 * ゲームでは レンネットで かためたが、ここでは「すっぱさ と ねつ」で かためる（パニール・カッテージチーズの なかま）。
 */
export function HomeExperiment({ onClose }: { onClose: () => void }) {
  return (
    <div className="screen dim" onClick={onClose}>
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <h2>🏠 おうちで やってみよう</h2>
        <div className="recipe">
          <p className="warn">⚠️ ひを つかうので、 かならず おとなの ひとと いっしょに やってね。</p>
          <div className="label">よういする もの</div>
          <ul>
            <li>ぎゅうにゅう 500ml（「せいぶん むちょうせい」と かいてある もの）</li>
            <li>レモンじる おおさじ2（す でも できるよ）</li>
            <li>なべ・おたま・ざる・キッチンペーパー</li>
            <li>しお すこし</li>
          </ul>
          <div className="label">つくりかた</div>
          <ol>
            <li>ぎゅうにゅうを なべで あたためる。 ふちが ふつふつ してきたら ひを とめる（ふっとう させない）</li>
            <li>レモンじるを いれて、 おたまで そーっと 2〜3かい まぜる</li>
            <li>そのまま 10ぷん まつ。 しろい かたまり（カード）と、 きいろっぽい みず（ホエイ）に わかれるよ</li>
            <li>キッチンペーパーを しいた ざるで こす</li>
            <li>しおを ひとつまみ ふって できあがり！</li>
          </ol>
          <p className="why">
            💡 ゲームでは レンネットで かためたけど、 これは レモンの 「すっぱさ」と 「ねつ」で かためる チーズ。 インドの パニールや、 カッテージチーズの なかま だよ。 しぼった ホエイは、 ホットケーキの ぎゅうにゅうの かわりに つかえるよ。
          </p>
          <p className="adult">
            <b>おうちの かたへ：</b>
            やけどに ご注意ください。牛乳アレルギーのある方は作らない・食べないでください。できたチーズは冷蔵庫に入れ、その日のうちにお召し上がりください。成分調整・低脂肪の牛乳では固まりにくいことがあります。
          </p>
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
