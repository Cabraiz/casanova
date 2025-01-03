import React, { useState, useEffect } from "react";
import { Item } from "./types";
import { getFromDB, saveToDB } from "./dbHelpers";
import ShimmerPlaceholder from "./ShimmerPlaceholder";
import { makeWhiteTransparent } from "./utils";

interface DesktopViewProps {
  items: { [page: number]: Item[] };
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  handlePageChange: (direction: "next" | "prev") => void;
  handleShowPayment: (item: Item) => void;
  isLoading: boolean;
  sortItems: (criterion: "price" | "name") => void;
}

const loadImage = async (
  id: string,
  imgSrc: string,
  inMemoryCache: { [id: string]: string | null }
): Promise<string | null> => {
  if (inMemoryCache[id]) {
    return inMemoryCache[id];
  }

  try {
    // Tenta obter do IndexedDB
    const cachedImage = await getFromDB(id);
    if (cachedImage) {
      inMemoryCache[id] = cachedImage;
      return cachedImage;
    }

    // Processa a imagem
    const img = new Image();
    img.src = imgSrc;

    const processedImage = await makeWhiteTransparent(img);
    if (!processedImage) {
      console.warn(`Falha no processamento para o item ${id}. Salvando imagem original.`);
      await saveToDB(id, imgSrc); // Salva a imagem original no IndexedDB
      inMemoryCache[id] = imgSrc;
      return imgSrc;
    }

    // Salva a imagem processada no IndexedDB
    await saveToDB(id, processedImage);
    inMemoryCache[id] = processedImage;
    return processedImage;
  } catch (error) {
    console.error(`Erro ao carregar imagem para o item ${id}:`, error);
    return null;
  }
};

const DesktopView: React.FC<DesktopViewProps> = ({
  items,
  currentPage,
  itemsPerPage,
  totalPages,
  handlePageChange,
  handleShowPayment,
  isLoading,
  sortItems,
}) => {
  const currentItems = items[currentPage] || [];
  const [processedImages, setProcessedImages] = useState<{ [id: string]: string | null }>({});
  const inMemoryCache: { [id: string]: string | null } = {};

  useEffect(() => {
    const loadAllImages = async () => {
      if (currentItems.length === 0) return; // Condição de parada

      const updates: { [id: string]: string | null } = {};
      await Promise.all(
        currentItems.map(async (item) => {
          // Evita processar imagens já carregadas
          if (processedImages[item.id]) return;
          const img = await loadImage(item.id.toString(), item.img, inMemoryCache);
          updates[item.id] = img || item.img; // Fallback para imagem original
        })
      );

      setProcessedImages((prev) => {
        // Verifica se há mudanças antes de atualizar o estado
        const hasNewImages = Object.keys(updates).some(
          (id) => prev[id] !== updates[id]
        );
        return hasNewImages ? { ...prev, ...updates } : prev;
      });
    };

    loadAllImages();
  }, [currentItems, processedImages]); // Inclui `processedImages` para evitar loops infinitos

  return (
    <div className="container mt-4 casanova-page">
      {/* Ordenação */}
      <div className="row mb-3">
        <div className="col text-end">
          <button
            className="btn btn-secondary me-2"
            onClick={() => sortItems("price")}
          >
            Ordenar por Preço
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => sortItems("name")}
          >
            Ordenar por Nome
          </button>
        </div>
      </div>

      {/* Itens */}
      <div className="row gy-3">
        {isLoading
          ? Array.from({ length: itemsPerPage }).map((_, index) => (
              <div key={`shimmer-${index}`} className="col">
                <div className="card h-100 shadow-sm">
                  <ShimmerPlaceholder height="150px" />
                  <div className="card-body text-center">
                    <ShimmerPlaceholder width="70%" height="20px" />
                    <ShimmerPlaceholder width="50%" height="20px" style={{ marginTop: "10px" }} />
                  </div>
                </div>
              </div>
            ))
          : currentItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="col">
                <div
                  className={`card h-100 shadow-sm position-relative ${
                    item?.purchased ? "border-success" : "border-primary"
                  }`}
                >
                  <div
                    className="shimmer-wrapper"
                    style={{
                      height: "150px",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    {processedImages[item.id] ? (
                      <img
                        src={processedImages[item.id] ?? item.img}
                        alt={item.name || "Imagem indisponível"}
                        className="card-img-top"
                        style={{ objectFit: "contain", height: "100%" }}
                      />
                    ) : (
                      <ShimmerPlaceholder height="100%" />
                    )}
                  </div>
                  <div className="card-body text-center">
                    <h5 className="card-title">
                      {item.name || <ShimmerPlaceholder width="70%" height="20px" />}
                    </h5>
                    <p className="card-text">
                      {item.price ? `R$ ${item.price.toFixed(2).replace(".", ",")}` : <ShimmerPlaceholder width="50%" height="20px" />}
                    </p>
                    <button
                      className={`btn w-100 ${item.purchased ? "btn-success" : "btn-primary"}`}
                      onClick={() => handleShowPayment(item)}
                      disabled={!item.price}
                    >
                      {item.purchased ? "Comprado ✔️" : "Ajudar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Navegação */}
      <div className="d-flex justify-content-between mt-4">
        <button
          className={`btn btn-outline-primary ${currentPage === 0 ? "disabled" : ""}`}
          onClick={() => handlePageChange("prev")}
          disabled={currentPage === 0}
        >
          ◀ Anterior
        </button>
        <button
          className={`btn btn-outline-primary ${currentPage >= totalPages - 1 ? "disabled" : ""}`}
          onClick={() => handlePageChange("next")}
          disabled={currentPage >= totalPages - 1}
        >
          Próximo ▶
        </button>
      </div>
    </div>
  );
};

export default DesktopView;
