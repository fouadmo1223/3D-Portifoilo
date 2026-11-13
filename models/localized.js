// A text field stored in both languages: { en, ar }.
export const localized = ({ required = false, max = 5000 } = {}) => ({
  en: { type: String, trim: true, maxlength: max, default: '', ...(required ? { required: true } : {}) },
  ar: { type: String, trim: true, maxlength: max, default: '' },
})

export const localizedList = () => ({
  en: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
  ar: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
})
