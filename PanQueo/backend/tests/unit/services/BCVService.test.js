const { parsearTasasBCV, limpiarNumero, extraerTasa, extraerFechaValor } = require('../../../src/services/BCVService');

const HTML_BCV = `
<section id="block-views-tipo-de-cambio-oficial-del-bcv-block">
  <div class="view-content">
    <div id="euro" class="col-sm-12 col-xs-12 ">
      <div class="field-content"><div class="row recuadrotsmc">
        <div class="col-sm-6 col-xs-6"><span> EUR </span></div>
        <div class="col-sm-6 col-xs-6 centrado textp"><strong class="strong-tb"> 989,71903352</strong></div>
      </div></div>
    </div>
    <div id="yuan" class="col-sm-12 col-xs-12">
      <strong class="strong-tb"> 133,22107552</strong>
    </div>
    <div id="dolar" class="col-sm-12 col-xs-12 ">
      <div class="field-content"><div class="row recuadrotsmc">
        <div class="col-sm-6 col-xs-6"><span> USD</span></div>
        <div class="col-sm-6 col-xs-6 centrado textp"><strong class="strong-tb">888,11830000</strong></div>
      </div></div>
    </div>
    <div class="pull-right dinpro center"> Fecha Valor:
      <span class="date-display-single" property="dc:date" datatype="xsd:dateTime"
            content="2026-10-28T00:00:00-04:00">Miércoles, 28 Octubre 2026</span>
    </div>
  </div>
</section>
`;

describe('BCVService - parseo del sitio oficial', () => {
  test('extrae la tasa USD del bloque id="dolar"', () => {
    expect(extraerTasa(HTML_BCV, 'dolar')).toBeCloseTo(888.1183, 4);
  });

  test('extrae la tasa EUR del bloque id="euro" sin confundirla con otras monedas', () => {
    expect(extraerTasa(HTML_BCV, 'euro')).toBeCloseTo(989.71903352, 4);
  });

  test('extrae la Fecha Valor en formato ISO', () => {
    expect(extraerFechaValor(HTML_BCV)).toBe('2026-10-28');
  });

  test('parsearTasasBCV devuelve USD, EUR y fecha valor', () => {
    const tasas = parsearTasasBCV(HTML_BCV);
    expect(tasas.usd).toBeCloseTo(888.1183, 4);
    expect(tasas.eur).toBeCloseTo(989.71903352, 4);
    expect(tasas.fechaValor).toBe('2026-10-28');
  });

  test('lanza error si el HTML no tiene la estructura esperada', () => {
    expect(() => parsearTasasBCV('<html><body>mantenimiento</body></html>')).toThrow(/BCV/);
  });

  test('convierte el formato numérico venezolano (miles con punto, decimales con coma)', () => {
    expect(limpiarNumero('888,11830000')).toBeCloseTo(888.1183, 4);
    expect(limpiarNumero('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(limpiarNumero(' 40,00 ')).toBeCloseTo(40, 2);
    expect(limpiarNumero('')).toBeNull();
    expect(limpiarNumero('abc')).toBeNull();
  });
});
