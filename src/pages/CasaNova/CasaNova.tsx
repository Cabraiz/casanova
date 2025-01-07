import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CasaNova.css';
import { isMobile } from 'react-device-detect';
import { fetchItems, fetchTotalItems } from './api';
import { generatePixPayload } from './utils';
import MobileView from './MobileView';
import DesktopView from './DesktopView';
import { Item } from './types';
import PaymentModal from './PaymentModal';
import LuxuryPopup from './LuxuryPopup';

const NewHomeGiftPage: React.FC = () => {
  const [popupVisible, setPopupVisible] = useState(true);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [items, setItems] = useState<{ [page: number]: Item[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage] = useState<number>(6);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [sortCriterion, setSortCriterion] = useState<'price' | 'name'>('price');

  // Controla o fundo e overflow do body
  useEffect(() => {
    if (popupVisible) {
      document.body.style.overflow = 'hidden'; // Evita scroll
      document.body.style.background = '#1a1a1d'; // Fundo uniforme escuro
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.background = ''; // Reseta para o padrão
    }

    // Cleanup ao desmontar ou mudar o estado
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.background = '';
    };
  }, [popupVisible]);

  const loadItems = async (pagesToLoad: number[]) => {
    try {
      setLoading(true);
  
      const fetchedPages = await Promise.all(
        pagesToLoad.map(async (page) => {
          const items = await fetchItems(page, itemsPerPage, sortCriterion); // Passa o critério de ordenação
          return { page, items };
        })
      );
  
      setItems((prev) => {
        const updatedItems = { ...prev };
        fetchedPages.forEach(({ page, items }) => {
          updatedItems[page] = items;
        });
        return updatedItems;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePopupSubmit = (option: string) => {
    console.log(`Opção selecionada: ${option}`);
    setPopupVisible(false);
    // Aqui você pode carregar itens ou outras ações após a seleção
  };

  const getMaxInstallments = (price: number): number => {
    if (price > 200) {
      return 5; // 5x para valores acima de R$200
    } else if (price > 160) {
      return 4; // 4x para valores acima de R$160
    } else if (price > 120) {
      return 3; // 3x para valores acima de R$120
    } else if (price > 80) {
      return 2; // 2x para valores acima de R$80
    }
    return 1; // 1x (à vista) para valores abaixo de R$80
  };
  
  
  useEffect(() => {
    const loadPages = async () => {
      const nextPages = [currentPage];
      const pagesToLoad = nextPages.filter((page) => !items[page]);
  
      if (pagesToLoad.length > 0) {
        const loadedPages = await Promise.all(
          pagesToLoad.map(async (page) => {
            const pageItems = await fetchItems(page, itemsPerPage, sortCriterion); // Passa o critério
            return { page, pageItems };
          })
        );
  
        setItems((prev) => {
          const updatedItems = { ...prev };
          loadedPages.forEach(({ page, pageItems }) => {
            updatedItems[page] = pageItems;
          });
          return updatedItems;
        });
      }
    };
  
    loadPages(); 
  }, [currentPage, sortCriterion]);
  
  

  const handleShowPayment = (item: Item) => {
    console.log("Abrindo modal para o item:", item);
    const payload = generatePixPayload(
      item.price,
      '61070800317',
      'Mateus Cardoso Cabral',
      'SAO PAULO'
    );
    setPixCode(payload);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setPixCode(null);
  };

  const handleSwipe = useCallback(
    (direction: 'up' | 'down') => {
      if (transitioning) return;

      const totalItemsFlat = Object.values(items).flat();
      const totalItemsCount = totalItemsFlat.length;

      let newIndex = currentPage;

      if (direction === 'up') {
        newIndex = Math.min(currentPage + 1, totalItemsCount - 1);
      } else if (direction === 'down') {
        newIndex = Math.max(currentPage - 1, 0);
      }

      if (newIndex !== currentPage) {
        setTransitioning(true); // Ativa transição
        setTimeout(() => setTransitioning(false), 300); // Duração da animação (300ms)
        setCurrentPage(newIndex); // Atualiza o índice atual
      }
    },
    [currentPage, items, transitioning]
  );

  
  const handleRedirectToCreditCard = async () => {
    if (!selectedItem) {
      console.error("Nenhum item selecionado para pagamento.");
      return;
    }
  
    try {
      const formattedPrice = parseFloat(selectedItem.price.toFixed(2));
      const maxInstallments = getMaxInstallments(formattedPrice);
  
      const response = await fetch(import.meta.env.VITE_MP_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: selectedItem.name || 'Sem título',
              quantity: 1,
              unit_price: formattedPrice,
            },
          ],
          back_urls: {
            success: `${import.meta.env.REACT_APP_BASE_API}/success`,
            failure: `${import.meta.env.REACT_APP_BASE_API}/failure`,
            pending: `${import.meta.env.REACT_APP_BASE_API}/pending`,
          },
          auto_return: 'approved',
          payment_methods: {
            installments: maxInstallments, // Define o número máximo de parcelas
            default_installments: 1, // Padrão: pagamento à vista
          },
        }),
      });
  
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Erro ao criar preferência de pagamento:", errorDetails);
        throw new Error(`Erro: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("Redirecionando para:", data.init_point);
      window.location.href = data.init_point; // Redireciona para o checkout
    } catch (error) {
      console.error("Erro ao redirecionar para pagamento:", error);
    }
  };
  
  const sortItems = (criterion: 'price' | 'name') => {
    setSortCriterion(criterion); // Define o novo critério de ordenação
    setCurrentPage(0); // Reseta a página atual
    setItems({}); // Limpa os itens atuais para forçar o recarregamento
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setCurrentPage((prevPage) => {
      const nextPage =
        direction === 'next' ? prevPage + 1 : Math.max(prevPage - 1, 0);
  
      // Retorna o próximo número de página
      return nextPage;
    });
  
    // Pré-carregar as próximas páginas (opcional)
    loadItems([currentPage + 1, currentPage + 2]);
  };


  return (
    <div className={`loading-container ${isMobile ? 'mobile-margins' : ''}`}>
      {popupVisible ? (
        <LuxuryPopup onSubmit={handlePopupSubmit} />
      ) : error ? (
        <div className="error-container">Erro: {error}</div>
      ) : isMobile ? (
        <MobileView
          items={Object.values(items).flat()}
          currentPage={currentPage}
          transitioning={transitioning}
          handleSwipe={handleSwipe}
          handleShowPayment={handleShowPayment}
          sortItems={sortItems}
        />
      ) : (
        <DesktopView
          items={items}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          handlePageChange={handlePageChange}
          handleShowPayment={handleShowPayment}
          isLoading={loading}
          sortItems={sortItems}
        />
      )}
      {!popupVisible && (
        <PaymentModal
          show={showModal}
          onClose={handleCloseModal}
          pixCode={pixCode}
          handleRedirectToCreditCard={handleRedirectToCreditCard}
        />
      )}
    </div>
  );
};

export default NewHomeGiftPage;