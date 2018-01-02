class BaseCollector {
    constructor() {
        this.logs = [];
    }
    get numErrors() {
        if (this.logs.length === 0) {
            return 0;
        }
        return this.logs[0].numErrors;
    }
}
