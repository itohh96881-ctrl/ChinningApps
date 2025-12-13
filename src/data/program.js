export const trainingSteps = [
    {
        rankId: 1,
        level: "0-1",
        title: "足つきぶら下がり (Feet Supported)",
        description: "まずは足を地面にベタっとつけたままぶら下がります。体重の一部を足に逃がし、フォームを確認しましょう。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 2,
        rest: 60,
        videoUrl: null,
        testCriteria: {
            title: "昇格試験: フォーム維持",
            description: "足をついた状態で、姿勢を崩さずに40秒間キープできるか確認します。次のステップへ進む基礎体力を証明してください。",
            target: { type: "time", value: 40, unit: "秒" }
        }
    },
    {
        rankId: 2,
        level: "0-2",
        title: "つま先立ちぶら下がり (Tiptoe Hang)",
        description: "足のサポートをつま先だけに減らします。手にかかる負荷が増えますが、まだ安全に調整できます。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 2,
        rest: 60,
        videoUrl: null,
        testCriteria: {
            title: "昇格試験: 負荷耐久",
            description: "つま先立ちの状態で40秒間耐えてください。これができれば、足を離す準備は完了です。",
            target: { type: "time", value: 40, unit: "秒" }
        }
    },
    {
        rankId: 3,
        level: "0-3",
        title: "ぶら下がり (Dead Hang)",
        description: "足を地面から離し、全体重を腕で支えます。肩をリラックスさせすぎず、少し力を入れた状態を保ちましょう。",
        target: { type: "time", value: 30, unit: "秒" },
        sets: 3,
        rest: 60,
        videoUrl: null,
        testCriteria: {
            title: "卒業試験: 完全ぶら下がり",
            description: "足を完全に離し、45秒間ぶら下がり続けてください。これに合格すれば、いよいよ「懸垂」の動作に入ります。",
            target: { type: "time", value: 45, unit: "秒" }
        }
    },
    {
        rankId: 4,
        level: 1,
        title: "斜め懸垂 (Australian Pull-up)",
        description: "低い鉄棒を使い、足を地面につけた状態で体を斜めに引き上げます。",
        target: { type: "count", value: 10, unit: "回" },
        sets: 3,
        rest: 90,
        videoUrl: null,
        testCriteria: {
            title: "昇格試験: 引きつけ力",
            description: "斜め懸垂を連続15回行ってください。背中の筋肉を使って引き上げる感覚をマスターしている必要があります。",
            target: { type: "count", value: 15, unit: "回" }
        }
    },
    {
        rankId: 5,
        level: 2,
        title: "ネガティブ懸垂 (Negative Pull-up)",
        description: "ジャンプして一番上の体勢になり、ゆっくりと時間をかけて下ろします。",
        target: { type: "count", value: 5, unit: "回" },
        sets: 3,
        rest: 120,
        videoUrl: null,
        testCriteria: {
            title: "昇格試験: 制動力",
            description: "ネガティブ懸垂を丁寧なフォームで8回繰り返してください。降りる動作を完全にコントロールできていますか？",
            target: { type: "count", value: 8, unit: "回" }
        }
    },
    {
        rankId: 6,
        level: 3,
        title: "懸垂 (Pull-up)",
        description: "反動を使わずに、顎がバーの上に来るまで引き上げます。",
        target: { type: "count", value: 1, unit: "回" },
        sets: 1,
        rest: 120,
        videoUrl: null,
        testCriteria: {
            title: "最終試験: 懸垂マスター",
            description: "正しいフォームで懸垂を3回連続で行ってください。反動は禁止です。",
            target: { type: "count", value: 3, unit: "回" }
        }
    }
];
