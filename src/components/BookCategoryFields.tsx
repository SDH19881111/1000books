'use client';

export interface BookCategorySelection {
  isProse: boolean;
  isEnglish: boolean;
}

interface BookCategoryFieldsProps extends BookCategorySelection {
  onChange: (selection: BookCategorySelection) => void;
  compact?: boolean;
}

const OPTIONS = [
  {
    key: 'isProse' as const,
    label: '줄글책',
    emoji: '📖',
    activeClass: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    key: 'isEnglish' as const,
    label: '영어책',
    emoji: '🔤',
    activeClass: 'border-sky-300 bg-sky-50 text-sky-700',
  },
];

export default function BookCategoryFields({
  isProse,
  isEnglish,
  onChange,
  compact = false,
}: BookCategoryFieldsProps) {
  const selection = { isProse, isEnglish };

  return (
    <fieldset>
      <legend className={compact ? 'sr-only' : 'mb-2 text-xs font-bold text-gray-500'}>
        책 분류 <span className="font-normal text-gray-400">(둘 다 선택 가능)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const checked = selection[option.key];
          return (
            <label
              key={option.key}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                checked
                  ? option.activeClass
                  : 'border-gray-200 bg-white/70 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  onChange({ ...selection, [option.key]: event.target.checked })
                }
                className="h-3.5 w-3.5 accent-pink-500"
              />
              <span aria-hidden>{option.emoji}</span>
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
