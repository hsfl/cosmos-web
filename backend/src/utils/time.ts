export const mjd_to_unix = (mjd:number) => {
    return (mjd-40587)*86400;
};

// Converts unix-seconds timestamp to MySQL DateTime string
export const unix_to_datetime = (unixtime: number) => {
    // Date takes unix milliseconds
    const date = new Date(unixtime*1000);
    const datestring = date.toJSON().replace('T', ' ').slice(0,-1);
    return datestring;
}
