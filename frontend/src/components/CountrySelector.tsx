import type { Country } from '../types';

interface Props {
  countries: Country[];
  selected:  string;
  onChange:  (code: string) => void;
}

export default function CountrySelector({ countries, selected, onChange }: Props) {
  return (
    <div className="country-selector">
      <label htmlFor="country-select">Pays :</label>
      <select
        id="country-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
