export class DataService {
    private data: any;

    constructor() {
        this.data = {};
    }

    public async fetchData(endpoint: string): Promise<any> {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        this.data = await response.json();
        return this.data;
    }

    public getData(): any {
        return this.data;
    }

    public saveData(key: string, value: any): void {
        this.data[key] = value;
    }

    public getDataByKey(key: string): any {
        return this.data[key];
    }
}