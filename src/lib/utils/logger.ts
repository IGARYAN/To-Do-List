if (!import.meta.env.DEV) {
    console.log = () => { };
    console.warn = () => { };
    // console.error оставляем
}