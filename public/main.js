const URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const limiteElementos = 400; // limite de elementos para traer de la api
const pagElementos = 20; // cantidad de elementos por pagina.

const departmentSelect = document.getElementById('department');
const keyWordInput = document.getElementById('keyWord');
const locationInput = document.getElementById('location');
const searchButton = document.getElementById('search');
const gallery = document.getElementById('galeria');
const loader = document.getElementById('loader');
const pagesContainer = document.getElementById('pages');

let paginaActual = 1;
let totalItems = 0;
let idsPorPagina = {};

//Funcion llenar el select con los departamentos
const loadDepartments = () => {
    return fetch(`${URL}/departments`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP! Estado: ${response.status}`); // Manejo de errores HTTP
            }
            return response.json();
        })
        .then(data => {
            departmentSelect.innerHTML = '<option value="">Todos</option>';

            data.departments.forEach(department => {
                const option = document.createElement("option");
                option.value = department.departmentId;
                option.textContent = department.displayName;
                departmentSelect.appendChild(option);
            });

            // Departamento seleccionado
            departmentSelect.addEventListener('change', (event) => {
                const selectedDepartment = event.target.value;

                paginaActual = 1;
                idsPorPagina = {};
                limpiarGaleria();  // Limpiar galería al cambiar el departamento
                searchArtworks(selectedDepartment);
            });
        })
        .catch(error => {
            console.error('Error al cargar los departamentos:', error);
        });
};


// Función para buscar objetos de arte
async function searchArtworks(departmentId = '') {
    const keyword = keyWordInput.value.trim();
    const location = locationInput.value.trim();

    resultadoTitulo.style.display = 'none';

    gallery.innerHTML = '';  // Limpiar la galería
    pagesContainer.innerHTML = '';

    resultadoTitulo.style.display = 'block';

    // Verifica si hay elementos en idsPorPagina
    if (!Object.keys(idsPorPagina).length) {
        document.querySelector('.galeria-container').style.display = 'none';
        return;  // Salir de la función si no hay objetos que mostrar
    }

    // Si hay objetos, muestra el contenedor de la galería
    document.querySelector('.galeria-container').style.display = 'block';  // Muestra el contenedor de la galería

    loader.style.display = 'block';
    
    try {
        
        let url = `${URL}/search?q=`;

        if (departmentId) {
            url += `&departmentId=${departmentId}`;
        }
        if (keyword) {
            url += `&keyword=${keyword}`;
        }
        if (location) {
            url += `&geoLocation=${location}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        totalItems = Math.min(data.total, limiteElementos);
        const objectIds = data.objectIDs ? data.objectIDs.slice(0, totalItems) : [];
        const paginatedIds = objectIds.slice((paginaActual - 1) * pagElementos, paginaActual * pagElementos);

        gallery.innerHTML = '';

        for (const objectId of paginatedIds) {
            const objectResponse = await fetch(`${URL}/objects/${objectId}`);
            const objectData = await objectResponse.json();
            displayArtwork(objectData);
        }

        // Llamar a la función de paginación después de obtener los objetos
        paginacion();

    } catch (error) {
        console.error('Error searching artworks:', error);
    } finally {
        loader.style.display = 'none';
    }
}

// Función para mostrar una obra de arte en la galería
async function displayArtwork(data) {
    const card = document.createElement('div');
    card.classList.add('tarjeta');
    card.setAttribute('role', 'article');
    card.setAttribute('aria-labelledby', data.title);

    const imageUrl = data.primaryImageSmall || 'https://via.placeholder.com/150';

    //elementos de contenido
    let title, culture, dynasty;

    try {
        title = data.title ? await translateText(data.title) : 'Título no disponible';
        culture = data.culture ? await translateText(data.culture) : 'Cultura no disponible';
        dynasty = data.dynasty ? await translateText(data.dynasty) : 'Dinastía no disponible';
    } catch (error) {
        console.error('Error translating text:', error);
        title = data.title || 'Título no disponible';
        culture = data.culture || 'Cultura no disponible';
        dynasty = data.dynasty || 'Dinastía no disponible';
    }

    const contentHTML = `
    <img src="${imageUrl}" alt="${data.title}">
    <div class="contenido-tarjeta">
        <h3>${title}</h3>
        <p>Cultura: ${culture}</p>
        <p>Dinastía: ${dynasty}</p>
        <span class="fecha">${data.objectDate}</span>
    </div>
`;

    card.innerHTML = contentHTML; // Agregar contenido de la tarjeta
    gallery.appendChild(card)

}

// Función Paginación
function paginacion() {
    const totalPaginas = calcularPaginasTotales(totalItems, pagElementos);  // Calcular páginas totales
    pagesContainer.innerHTML = '';  // Limpiar paginación anterior

    // Botón de página anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.disabled = paginaActual === 1;  // Deshabilitar si es la primera página
    btnAnterior.classList.add('pages-button');
    btnAnterior.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            searchArtworks();
        }
    });
    pagesContainer.appendChild(btnAnterior);

    // Botones de páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.disabled = (i === paginaActual);  // Deshabilitar el botón de la página actual
        button.classList.add('pages-button');
        button.addEventListener('click', () => {
            paginaActual = i;
            searchArtworks();
        });
        pagesContainer.appendChild(button);
    }

    // Botón de página siguiente
    const btnSiguiente = document.createElement('button');
    btnSiguiente.textContent = 'Siguiente';
    btnSiguiente.disabled = paginaActual * pagElementos >= totalItems;  // Deshabilitar si es la última página
    btnSiguiente.classList.add('pages-button');
    btnSiguiente.addEventListener('click', () => {
        if (paginaActual * pagElementos < totalItems) {
            paginaActual++;
            searchArtworks();
        }
    });
    pagesContainer.appendChild(btnSiguiente);

    if (totalItems === 0) {
        pagesContainer.style.display = 'none';  // Ocultar la paginación si no hay resultados
        return;
    } else {
        pagesContainer.style.display = 'block';  // Mostrar la paginación si hay resultados
    }
}


// Función para calcular el número total de páginas
function calcularPaginasTotales(totalItems, pagElementos) {
    return Math.ceil(totalItems / pagElementos);  // Redondear hacia arriba
}

// Función para traducir texto
async function translateText(text) {
    if (!text) return '';
    try {
        const response = await fetch(`https://tpintegrador-museo.onrender.com/translate?text=${encodeURIComponent(text)}`);
        const translation = await response.json();
        return translation.translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; // Devuelve el texto original en caso de error
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDepartments();

    searchButton.addEventListener('click', () => {
        paginaActual = 1;
        mostrarLoader();
        searchArtworks();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();  // clic al presionar Enter
        }
    });
});


// Función para mostrar el cargado
function mostrarLoader() {
    loader.style.display = 'block';
}

// Función para ocultar el cargado
function ocultarLoader() {
    loader.style.display = 'none';
}

//Funcion limpiar la galeria
function limpiarGaleria() {
    gallery.innerHTML = ''; // Limpiar el contenido de la galería
    document.querySelector('.galeria-container').style.display = 'none';
}













