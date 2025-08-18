// Utilitaires de formatage des nombres
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate un nombre en supprimant les zéros de tête et en ajoutant des espaces comme séparateurs de milliers
 * @param value - Le nombre à formater (peut être un number ou une string)
 * @returns Le nombre formaté avec des espaces comme séparateurs
 */
export const formatNumberWithSpaces = (value: number | string): string => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  // Convertir en string et supprimer les zéros de tête
  let numStr = String(value).replace(/^0+/, '') || '0';
  
  // Convertir en nombre pour s'assurer que c'est valide
  const num = parseFloat(numStr);
  
  if (isNaN(num)) {
    return '0';
  }

  // Formater avec des espaces comme séparateurs de milliers
  return num.toLocaleString('fr-FR').replace(/,/g, ' ');
};

/**
 * Parse une chaîne formatée avec des espaces et la convertit en nombre
 * @param formattedValue - La chaîne formatée avec des espaces
 * @returns Le nombre correspondant
 */
export const parseFormattedNumber = (formattedValue: string): number => {
  if (!formattedValue || formattedValue.trim() === '') {
    return 0;
  }

  // Supprimer tous les espaces et convertir en nombre
  const cleanValue = formattedValue.replace(/\s/g, '');
  const num = parseFloat(cleanValue);
  
  return isNaN(num) ? 0 : num;
};

/**
 * Formate un montant en Ariary avec le formatage des espaces
 * @param amount - Le montant à formater
 * @returns Le montant formaté avec "Ar" à la fin
 */
export const formatAriary = (amount: number): string => {
  return `${formatNumberWithSpaces(amount)} Ar`;
};

/**
 * Hook personnalisé pour gérer les inputs numériques formatés
 * @param initialValue - Valeur initiale
 * @param onChange - Callback appelé quand la valeur change
 * @returns [displayValue, handleChange] - Valeur d'affichage formatée et gestionnaire de changement
 */
export const useFormattedNumberInput = (
  initialValue: number,
  onChange: (value: number) => void
): [string, (e: React.ChangeEvent<HTMLInputElement>) => void] => {
  const displayValue = formatNumberWithSpaces(initialValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFormattedNumber(e.target.value);
    onChange(parsedValue);
  };

  return [displayValue, handleChange];
};

/**
 * Formate une date en utilisant le format français
 * @param date - La date à formater
 * @param formatString - Le format de date (par défaut: 'dd/MM/yyyy')
 * @returns La date formatée
 */
export const formatDate = (date: Date | string | null | undefined, formatString: string = 'dd/MM/yyyy'): string => {
  if (!date) {
    return '';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Vérifier si la date est valide
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return format(date, formatString, { locale: fr });
};

/**
 * Formate une date de manière sécurisée en gérant les valeurs invalides
 * @param date - La date à formater
 * @param formatString - Le format de date (par défaut: 'dd/MM/yyyy')
 * @returns La date formatée ou une chaîne vide si la date est invalide
 */
export const safeFormatDate = (date: Date | string | null | undefined, formatString: string = 'dd/MM/yyyy'): string => {
  if (!date) {
    return '';
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Vérifier si la date est valide
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return format(dateObj, formatString, { locale: fr });
};