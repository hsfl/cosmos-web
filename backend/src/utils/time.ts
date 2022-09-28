export const mjd_to_unix = (mjd:number) => {
    return (mjd-40587)*86400;
};
