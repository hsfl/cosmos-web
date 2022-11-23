export interface api_response {
    message: string;
    payload?: any;
}

export const new_api_response = (message: string) : api_response => {
    return {message: message};
};
