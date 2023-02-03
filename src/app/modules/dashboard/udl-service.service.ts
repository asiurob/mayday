import { Injectable } from '@angular/core';
import * as xmljs from 'xml-js';
@Injectable({
  providedIn: 'root'
})
export class UdlService {
  private code = 'd@t0s2211ñQ';
  private soapUrl = 'http://201.168.154.186/WebServices/Wsinfo/Service1.svc';
  constructor() { }

  async getFilters(method: string): Promise<any[]> {
    const params: SoapParameters = {method, parameters: []};
    const response = await this.buildSoapRequest(method, this.buildSoapEnvelope(params));
    return response ? this.parseFiltersResponse(response) : [];
  }

  async getChartsData( params: SoapParameters ): Promise<any> {
    const response = await this.buildSoapRequest(params.method, this.buildSoapFiltersEnvelope(params));
    return response ? this.parseChartsResponse(response) : [];
  }


  private async buildSoapRequest(method: string, body: string): Promise<string | undefined> {
    try {
      const fetchData = await fetch(this.soapUrl, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `http://tempuri.org/IService1/${method}`
        }
      });
      return await fetchData.text();
    } catch (error: unknown) {
      console.log(error);
      return undefined;
    }
  }

  private buildSoapFiltersEnvelope(params: SoapParameters): string {
    return `
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <CargaTablas xmlns="http://tempuri.org/">
        ${this.buildSoapFilters(params)}
        <hash_code>${this.code}</hash_code>
        </CargaTablas>
      </s:Body>
    </s:Envelope>`;
  }


  private buildSoapEnvelope( params: SoapParameters, buildingFilters?: boolean ): string {

    return `
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        ${buildingFilters ? this.buildSoapFilters(params) : this.buildSoapParameters(params)}
      </s:Body>
    </s:Envelope>`;
  }

  private buildSoapParameters( params: SoapParameters ): string {
    let parameters = `<${params.method} xmlns="http://tempuri.org/">`;
    params.parameters.forEach( param => {
      parameters += `<${param.key}>${param.value}</${param.key}>`;
    })
    parameters += `<hash_code>${this.code}</hash_code>`
    parameters += `</${params.method}>`;
    return parameters;
  }

  private buildSoapFilters(params: SoapParameters): string {
    let parameters = `
    <filtros>
    <?xml version='1.0'?>
    <parametros xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
    xmlns:xsd='http://www.w3.org/2001/XMLSchema'>
    <elementos>`;
    params.parameters.forEach( param => {
      parameters += `
        <elemento>
          <nombre>${param.key.toLowerCase()}</nombre>
          <valor>'${param.value}'</valor>
        </elemento>
      `;
    })
    parameters += `</elementos></parametros></filtros>`;

    return parameters;
  }



  private parseFiltersResponse(xml: string): any[] {
    const parsedXml: any = xmljs.xml2js(xml, { compact: true});
    const dataset = parsedXml['s:Envelope']['s:Body']['CargaFiltrosResponse']['CargaFiltrosResult']['diffgr:diffgram']['NewDataSet'];
    const result: any[] = [];
    Object.keys(dataset).forEach( key => {
      const object: any = {};
      object.key = key;
      object.name = key;
      object.options = [];
      if( Array.isArray( dataset[key] ) ) {
        dataset[key].forEach( (item: any) => {
          object.options.push({ value: item.id._text, label: item.valor._text });
        });
      }
      result.push(object);
    });
    return result.filter( item => item.options && item.options.length > 0 );
  }

  private parseChartsResponse(xml: string): any[] {
    return [];
  }

}

export interface SoapParameters {
  method: string;
  parameters: {
    key: string;
    value: string;
  }[]
}

/**
 *
 * CargaTablas (string filtros, string hash_code)
 
filtros:
 
<Temporalidad>01/01/2010,31/12/2011</Temporalidad><ComoVer>Meses</ComoVer><Area>18,27,46</Area><Ciclos>021,022</Ciclos><Turnos>3,5,7</Turnos>

 *
 *
 */
