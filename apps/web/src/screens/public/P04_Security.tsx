// 画面ID: P-04 セキュリティとデータの扱い
import "./public.css";
import type { ReactNode } from "react";
import { Button, DataClassBadge, Icon, PublicLayout } from "../../ui";
import type { IconName } from "../../ui";
import { paths } from "../../lib/paths";
import { DATA_CLASS } from "../../lib/vocab";
import type { DataClass } from "../../lib/vocab";

function Block({ id, icon, title, children }: { id: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <section id={id} className="card stack" style={{ ["--gap" as string]: "12px", scrollMarginTop: 90 }}>
      <div className="row" style={{ ["--gap" as string]: "12px" }}>
        <span className="feature-icon"><Icon name={icon} /></span>
        <h2 className="headline" style={{ fontSize: "var(--text-lg)" }}>{title}</h2>
      </div>
      <div className="small" style={{ color: "var(--muted-strong)", lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export function P04Security() {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">SECURITY & DATA</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>セキュリティとデータの扱い</h1>
          <p className="lead">お客様のコードと要求は、お客様の資産です。AI に何を送り、何を送らないかを明示します。</p>
        </div>
      </section>
      <div className="container stack" style={{ paddingBottom: 72 }}>
        <div className="grid cols-2">
          <Block id="send" icon="upload" title="AIに送るデータ">
            <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
              <li>レビュー対象の要求・設計の本文（データ分類で許可された範囲）</li>
              <li>SOW から抽出する対象の文書</li>
              <li>リンク候補を作るための ID とタイトル</li>
            </ul>
          </Block>
          <Block id="notsend" icon="eyeOff" title="AIに送らないデータ">
            <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
              <li>認証情報、シークレット、トークン</li>
              <li>Highly Confidential に分類したプロジェクトのデータ（閉域実行を除く）</li>
              <li>AI 機能を無効にした組織・機能のデータ</li>
            </ul>
          </Block>
        </div>
        <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
          <h2 className="headline" style={{ fontSize: "var(--text-lg)" }}>データ分類ごとの実行先</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>分類</th><th>実行先</th></tr></thead>
              <tbody>
                {(Object.keys(DATA_CLASS) as DataClass[]).map((k) => (
                  <tr key={k}><td><DataClassBadge value={k} /></td><td>{DATA_CLASS[k].runtime}</td></tr>
                ))}
                <tr><td><span className="badge square tone-fail">Secret／Credential</span></td><td>LLM へ送りません</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <div className="grid cols-2">
          <Block id="training" icon="lock" title="学習利用の禁止と保持期間">
            AI の提供元とは、入力・出力を学習に使わない契約を結んだうえで利用します。プロンプトの本文は永続保存せず、テンプレートのバージョン・モデル識別子・入出力のハッシュだけを証跡に残します。
          </Block>
          <Block id="disable" icon="settings" title="AI機能の無効化">
            組織全体、機能ごと、プロジェクトのデータ分類ごとに AI 機能を無効にできます。無効にしても、ゲートの判定と証跡の記録はそのまま動きます。
          </Block>
          <Block id="evidence" icon="signature" title="証跡の署名と保管">
            リリースごとの Evidence Manifest に暗号署名し、Git ホスティングとは別の信頼境界にある追記専用（WORM）の保管先に、保持期間中は削除・上書きできない状態で保存します。
          </Block>
          <Block id="sod" icon="users" title="権限と職務分離">
            作成者は自分の成果物を承認できません。AI エージェントには承認・マージ・ポリシー編集・証跡削除の権限を与えません。管理者による無条件のバイパスもありません。
          </Block>
          <Block id="injection" icon="shield" title="文書に紛れ込んだ指示への対策">
            リポジトリ・Issue・SOW・コメントは信頼できない入力として扱い、型付きのデータに変換してから AI に渡します。AI への指示とみられる文を検出すると処理を止め、人に確認を依頼します。
          </Block>
          <Block id="credential" icon="key" title="AI エージェントの認証情報">
            AI エージェントには、リポジトリ単位で権限を絞った短命の認証情報を処理ごとに発行します。実行できる操作は許可リストに限り、外部 URL の取得は既定で無効です。
          </Block>
          <Block id="connectors" icon="plug" title="連携先の資格情報と同期データ">
            コードホスティング・計画管理・カレンダー・チャットの資格情報は暗号化して組織ごとに分離し、ローテーションと失効を記録します。Webhook は署名を検証し、偽装や再送を拒否します。カレンダーは許可した共有カレンダーの件名・日時など最小限の項目だけを取り込み、個人の非公開予定は取り込みません。
          </Block>
          <Block id="access" icon="eye" title="閲覧範囲とアクセス制御">
            経営層ごとに組織・事業部・顧客・案件・機密区分の閲覧範囲を設定し、役職だけで全社閲覧を付与しません。MFA を必須にでき、退職者の無効化は連携先・承認・通知・当番に反映します。
          </Block>
          <Block id="region" icon="globe" title="保存地域と削除">
            データと証跡のバックアップは日本国内のリージョンに保存します。AI の提供先（再委託先）と処理リージョンは設定画面で公開し、変更は事前に通知します。組織を削除すると、連携先から取り込んだ複製も含めて削除します（WORM に保管した証跡は保持期限まで残ります）。
          </Block>
          <Block id="ops" icon="server" title="運用と障害への備え">
            マルチテナントの分離、通信・保管の暗号化、バックアップと復旧の手順、監視とアラートを運用します。障害や保守の予定は稼働状況のページで告知します。
          </Block>
        </div>
        <section className="card row between" style={{ ["--gap" as string]: "16px" }}>
          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
            <strong className="strong">セキュリティに関するお問い合わせ</strong>
            <span className="small muted">security@product.example（脆弱性の報告もこちらへ）</span>
          </div>
          <span className="row" style={{ ["--gap" as string]: "8px" }}>
            <Button variant="secondary" to={paths.support()}>脆弱性の報告</Button>
            <Button variant="ghost" to={paths.status()}>稼働状況</Button>
          </span>
        </section>
      </div>
    </PublicLayout>
  );
}
