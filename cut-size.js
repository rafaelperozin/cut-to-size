'use strict';
let $j = jQuery.noConflict();
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// DOM insteractions and elements class/id #######################################################################################################
const userInteraction = () => {
    const DOMelement = {
        priceNoVatEl: '#lmc-price',
        priceNoVatData: 'data-lmc-price',
        minLengthEl: '#lmc-lengthmin',
        minLengthData: 'data-lmc-lengthmin',
        maxLengthEl: '#lmc-lengthmax',
        maxLengthData: 'data-lmc-lengthmax',
        lengthEl: 'dd.SheetLengthmm',
        widthEl: 'dd.SheetWidthmm',
        widthElSelect: 'dd.SheetWidthmm select',
        legthElInput: 'dd.SheetLengthmm input',
        legthElLabel: 'dt.SheetLengthmm label',
        widthElInput: 'dd.SheetWidthmm input',
        pricePerUnit: '.price span',
        pricePerMeter: '.pricePerMeter',
        incVat: '.priceWrap .mainPriceBlock span .vat',
        rrpElement: '.priceWrap .mainDiscountBlock .was span',
        borderColour: '#686868',
        ppMeaEl: '.ppMea',
        minEl: '.mmdiv .min',
        maxEl: '.mmdiv .max'
    }

    const newElement = {
        mainPerItem: `Per item | Inc. Vat`,
        mainPerSquareM: `Per m<sup>2</sup> | Inc. Vat`,
        mainPerMeter: `Per meter | Inc. Vat`,
        secPerMeter: (pricePerMeter, measureUnit) => `<span class="ppMea">£${pricePerMeter} per ${measureUnit}</span>`,
        minMaxDiv: (min, max) => `<div class="mmdiv"><span class="min">Min: ${min}mm</span> | <span class="max">Max: ${max}mm</span></div>`,
        inputMeasureUnit: `<span class="imunit">MM</span>`
    }

    // when ready run this function to fix all values and fields
    const refreshingDOM = (q, ppm) => {
        if (q === 'first') {
            // Exist (custom WIDTH [or] custom LENGTH) field? =========================================================================
            if ($j(DOMelement.lengthEl).length > 0 || $j(DOMelement.widthEl).length) {
                // It's (just custom LENGTH) [or] (custom LENGTH [and] no select width)
                // -- just length
                if ($j(DOMelement.legthElInput).length > 0 && $j(DOMelement.widthElSelect).length === 0 && $j(DOMelement.widthElInput).length === 0) {
                    // change "included vat" > "Per Meter | Inc. Vat"
                    $j(DOMelement.incVat).html(newElement.mainPerMeter);
                    window.measure = 'meter';
                }
                // -- custom length and pre-set width
                if ($j(DOMelement.legthElInput).length > 0 && $j(DOMelement.widthElSelect).length > 0) {
                    // change "included vat" > "Per m2 | Inc. Vat"
                    $j(DOMelement.incVat).html(newElement.mainPerSquareM);
                    window.measure = 'm2';
                }
                // insert min and max under the label
                const min = Number($j(DOMelement.minLengthEl).attr(DOMelement.minLengthData));
                const max = Number($j(DOMelement.maxLengthEl).attr(DOMelement.maxLengthData));
                $j(newElement.minMaxDiv(min, max)).insertAfter(DOMelement.legthElLabel);
                // insert measure after ipnut field
                $j(newElement.inputMeasureUnit).insertAfter(DOMelement.legthElInput);
            }
        } else {
            // change price per m2/meter per price per item
            $j(DOMelement.incVat).html(newElement.mainPerItem);
            // Insert price per meter/m2 under the price per unit
            ($j(DOMelement.ppMeaEl).length === 0) ? $j(newElement.secPerMeter(ppm, window.measure)).insertAfter(DOMelement.incVat): $j(DOMelement.ppMeaEl).replaceWith(newElement.secPerMeter(ppm, window.measure));
            // calculate RRP for desired size and update on DOM
            const rrPrice = calcPrice().updatePricePerItem($j(DOMelement.legthElInput).val(), 'rrp');
            $j(DOMelement.rrpElement).html(rrPrice);
        }
    }

    return {
        getElement() {
            // call outside using: userInteraction().getElement().addCart / userInteraction().getElement().addCartActive / ...
            return DOMelement;
        },
        generateNewElement() {
            return newElement;
        },
        firstLoadDOM() {
            refreshingDOM('first');
        },
        refreshDOM(ppm, mu) {
            refreshingDOM('refresh', ppm);
        }
    };
};

// Make the things happen ########################################################################################################################
const calcPrice = () => {
    const FELE = userInteraction().getElement();

    const squareM = 1000000;
    const meter = 1000;
    const vatVal = 1.2;

    // ELEMENTS =============================================================================================
    const ELE = {
        priceNoVatElement: document.querySelector(FELE.priceNoVatEl),
        minLengthElement: document.querySelector(FELE.minLengthEl),
        maxLengthElement: document.querySelector(FELE.maxLengthEl),
        widthSelectElement: document.querySelector(FELE.widthElSelect),
        legthInputElement: document.querySelector(FELE.legthElInput),
        priceUnitElement: document.querySelector(FELE.pricePerUnit),
        rrpVal: document.querySelector(FELE.rrpElement),
        minElement: document.querySelector(FELE.minEl),
        maxElement: document.querySelector(FELE.maxEl)
    }

    // get price without vat
    const nudePrice = ELE.priceNoVatElement.getAttribute(FELE.priceNoVatData);
    // get min / max length
    const minLeg = Number(ELE.minLengthElement.getAttribute(FELE.minLengthData));
    const maxLeg = Number(ELE.maxLengthElement.getAttribute(FELE.maxLengthData));

    // EXTRA FUNCTIONS ===========================================================================================
    const priceIncludedVAT = () => nudePrice * vatVal;
    const squareMeterPrice = m => priceIncludedVAT() / m;
    const squareMeterRRP = m => {
        return ELE.rrpVal.textContent.slice(1, ELE.rrpVal.textContent.length) / m;
    }

    // make element border red 
    const warnField = (e, colour, mm) => {
        const normalColour = FELE.borderColour;
        e.style.border = `1px solid ${colour}`;
        // when border red, min or max text needs to be red too
        if (mm === 'min') {
            ELE.maxElement.style.color = normalColour;
            ELE.minElement.style.color = colour;
        } else if (mm === 'max') {
            ELE.minElement.style.color = normalColour;
            ELE.maxElement.style.color = colour;
        } else {
            ELE.minElement.style.color = normalColour;
            ELE.maxElement.style.color = normalColour;
        }
    }

    // COMPLEMENTARY FUNCTIONS ===========================================================================================
    // Hide and Show elements ------------------------------------------------------------------------------
    const updatingPricePerItem = (length, rrp) => {

        let measure, size, finalPrice;

        // verify is is we need to show meter or m2
        if (window.measure === 'm2') {
            const selectedOptVal = ELE.widthSelectElement[ELE.widthSelectElement.selectedIndex].value;
            const selectedOptTxt = ELE.widthSelectElement[ELE.widthSelectElement.selectedIndex].text;

            // don't update because we don't know the width yet
            if (selectedOptVal === '') return;

            measure = squareM
            // multiplty length by width (selected)
            size = length * selectedOptTxt;
        } else {
            measure = meter;
            // don't need to multiplty length by width because width is fixed
            size = length;
        }

        // calculate the price per item
        (rrp) ? finalPrice = squareMeterRRP(measure) * size: finalPrice = squareMeterPrice(measure) * size;
        // set up to show just 2 numbers after . and add £ in the beginning
        finalPrice = '£' + finalPrice.toFixed(2);

        return finalPrice;
    }

    // Verifying if the inputed value is between min and max limit ------------------------------------------
    const verifyingMinMax = value => {
        if (Number(value) < minLeg) {
            const res = 'min';
            return res;
        } else if (Number(value) > maxLeg) {
            const res = 'max';
            return res;
        } else {
            const res = true;
            return res;
        }
    }

    // MAIN FUNCTION =============================================================================================================
    const mainfunction = (v) => {
        // verify if desired size is between min and max length
        const verifiedLength = verifyingMinMax(v);
        // if is TRUE (in the limit)
        if (verifiedLength === true) {
            // change input border for grey
            warnField(ELE.legthInputElement, FELE.borderColour);
            // get the cutsized rice
            const lastPrice = updatingPricePerItem(v);

            if (lastPrice) {
                // update the unit price
                ELE.priceUnitElement.innerHTML = lastPrice;

                // Update text and values on the DOM
                userInteraction().refreshDOM(priceIncludedVAT().toFixed(2));
            }
        } else if (verifiedLength === 'min') {
            // change input border for red
            warnField(ELE.legthInputElement, 'red', 'min');
        } else if (verifiedLength === 'max') {
            // change input border for red
            warnField(ELE.legthInputElement, 'red', 'max');
        }
    }
    const isItCutSizeProd = (e) => {
        // It's (just custom LENGTH) [or] (custom LENGTH [and] no select width)
        if (($j(FELE.widthElSelect).length === 0 && $j(FELE.widthElInput).length === 0) || $j(FELE.widthElSelect).length > 0) {
            // Verify if value is between MIN and MAX --> if not: red show error and don't update the price
            if (e > 0) {
                calcPrice().mainfunc(e);
            }
        }
    }

    // When you call this function you should call the return functions too =================================
    return {
        getPricePerItem(m, l, w) {
            gettingPricePerItem(m, l, w);
        },
        mainfunc(v) {
            return mainfunction(v);
        },
        updatePricePerItem(l, r) {
            return updatingPricePerItem(l, r);
        },
        verifyCutSizeProd(e) {
            isItCutSizeProd(e);
        }
    };
}

// Fite actions on events #######################################################################################################################
// help to get elements from DOM calling userInteraction function
const FELE = userInteraction().getElement();

jQuery(document).ready(() => {
    // 1. fix all fields and content for cut size products
    userInteraction().firstLoadDOM();

    // 2. On event (change paste keyup mouseup mousewheel) get the value | send value of input (current target)
    $j(FELE.legthElInput).on('change paste', (e) => calcPrice().verifyCutSizeProd(e.target.value));

    // 2. On event "select changed" get the value | send value of input (NOT current target)
    $j(FELE.widthElSelect).on('change', () => calcPrice().verifyCutSizeProd($j(FELE.legthElInput).val()));
});