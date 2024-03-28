unction uniq(arr:{ className: string, schema: string }[]): { className: string, schema: string }[] {
    return arr.sort().filter((item, pos, ary) =>{
        return !pos || item.schema != ary[pos - 1].schema;
    });
}


export function parseStringJsonToTypeScriptSchema(input: string): { className: string, schema: string } {
    const json = JSON.parse(input);
    const className = `Parsed${Math.random().toString(36).substring(7)}`;

    // @eslint-ignore-next-line
    const schema = (<any>Object).entries(json).sort(([keyA,], [keyB,]) => keyA.localeCompare(keyB)).reduce((schema, [key, value]) => {
        switch (typeof value) {
            case 'number':
                schema += `\n    ${key}: number;`
                break;
            case 'string':
                schema += `\n    ${key}: string;`
                break;
            case 'boolean':
                schema += `\n    ${key}: boolean;`
                break;
            case 'object':
                if (Array.isArray(value)) {
                    const nestedSchemas = uniq(value.map((nestedValue) => {
                        switch (typeof nestedValue) {
                            case 'number':
                                return {className: 'number', schema: undefined};
                                break;
                            case 'string':
                                return {className: 'string', schema: undefined};
                                break;
                            case 'boolean':
                                return {className: 'boolean', schema: undefined};
                                break;
                            case 'object':
                                return parseStringJsonToTypeScriptSchema(JSON.stringify(nestedValue))
                                break;
                        }
                    }));
                    schema = nestedSchemas.filter(({schema})=>schema).map(({schema}) => (schema)).join('\n') + schema
                    if(nestedSchemas.length > 1){
                        schema += `\n    ${key}: (${nestedSchemas.map(({className}) => (className)).join(' | ')})[];`
                    } else {
                        schema += `\n    ${key}: ${nestedSchemas.shift().className}[];`
                    }
                } else {
                    const { className: nestedClassName, schema: nestedSchema} = parseStringJsonToTypeScriptSchema(JSON.stringify(value));
                    schema = `${nestedSchema}\n` + schema
                    schema += `\n    ${key}: ${nestedClassName};`
                }
                break;
            default:
                break;
        }
        return schema;
    }, `\nexport class ${className} {`)
    return {
        className, schema: schema + `\n}\n`
    }

}
