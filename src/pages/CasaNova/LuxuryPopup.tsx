import React, { useEffect, useState } from 'react';
import './LuxuryPage.css';

interface LuxuryPopupProps {
  onSubmit: (option: string) => void;
}

const LuxuryPopup: React.FC<LuxuryPopupProps> = ({ onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden'; // Evita scroll no fundo
    return () => {
      document.body.style.overflow = 'auto'; // Restaura scroll ao desmontar
    };
  }, []);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    setErrorMessage(null); // Limpa o erro ao selecionar uma opção
  };

  const handleProceed = () => {
    if (!selectedOption) {
      setErrorMessage('Por favor, selecione uma opção antes de continuar. Clique em "Família" ou "Amigos".');
    } else {
      onSubmit(selectedOption);
    }
  };

  return (
    <div className="luxury-popup-overlay">
      <div className="luxury-popup-container">
        <h2 className="luxury-popup-title">Escolha uma opção</h2>
        <div className="luxury-popup-options">
          <button
            className={`luxury-popup-option ${
              selectedOption === 'Familia' ? 'selected' : ''
            }`}
            onClick={() => handleOptionChange('Familia')}
          >
            Família
          </button>
          <button
            className={`luxury-popup-option ${
              selectedOption === 'Amigos' ? 'selected' : ''
            }`}
            onClick={() => handleOptionChange('Amigos')}
          >
            Amigos
          </button>
        </div>
        {errorMessage && (
          <p className="luxury-popup-error">{errorMessage}</p>
        )}
        <button
          className="luxury-popup-proceed-button"
          onClick={handleProceed}
        >
          Prosseguir
        </button>
      </div>
    </div>
  );
};

export default LuxuryPopup;