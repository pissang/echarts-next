define(function (require) {

    var zrUtil = require('zrender/core/util');
    var symbolUtil = require('../../util/symbol');
    var graphic = require('../../util/graphic');

    function normalizeSymbolSize(symbolSize) {
        if (!zrUtil.isArray(symbolSize)) {
            symbolSize = [+symbolSize, +symbolSize];
        }
        return symbolSize;
    }

    /**
     * @constructor
     * @extends {module:zrender/graphic/Group}
     */
    function Symbol(data, idx, api) {
        graphic.Group.call(this);

        this.updateSymbol(data, idx, api);
    }

    var symbolProto = Symbol.prototype;

    symbolProto._createSymbol = function (symbolType, data, idx, api) {
        this.removeAll();

        var color = data.getItemVisual(idx, 'color');

        var symbolPath = symbolUtil.createSymbol(
            symbolType, -0.5, -0.5, 1, 1, color
        );
        symbolPath.style.strokeNoScale = true;

        symbolPath.attr({
            z2: 100
        });
        symbolPath.attr('scale', [0, 0]);
        this.add(symbolPath);
        var size = normalizeSymbolSize(data.getItemVisual(idx, 'symbolSize'));

        api.initGraphicEl(symbolPath, {
            scale: size
        });

        this._symbolType = symbolType;
    };

    /**
     * Update symbol properties
     * @param  {module:echarts/data/List} data
     * @param  {number} idx
     * @param  {module:echarts/ExtensionAPI} api
     */
    symbolProto.updateSymbol = function (data, idx, api) {
        var symbolType = data.getItemVisual(idx, 'symbol') || 'circle';

        if (symbolType !== this._symbolType) {
            this._createSymbol(symbolType, data, idx, api);
        }
        else {
            var symbolPath = this.childAt(0);
            var size = normalizeSymbolSize(data.getItemVisual(idx, 'symbolSize'));
            api.updateGraphicEl(symbolPath, {
                scale: size
            });
        }
        this._updateCommon(data, idx);
    };

    // Update common properties
    var normalStyleAccessPath = ['itemStyle', 'normal'];
    var emphasisStyleAccessPath = ['itemStyle', 'emphasis'];
    symbolProto._updateCommon = function (data, idx) {
        var symbolPath = this.childAt(0);
        var seriesModel = data.hostModel;
        var itemModel = data.getItemModel(idx);
        var normalItemStyleModel = itemModel.getModel(normalStyleAccessPath);
        var color = data.getItemVisual(idx, 'color');

        var hoverStyle = itemModel.getModel(emphasisStyleAccessPath).getItemStyle();

        symbolPath.rotation = itemModel.get('symbolRotate') * Math.PI / 180 || 0;

        symbolPath.setColor(color);

        zrUtil.extend(
            symbolPath.style,
            // Color must be excluded.
            // Because symbol provide setColor individually to set fill and stroke
            normalItemStyleModel.getItemStyle(['color'])
        );

        var labelModel = itemModel.getModel('label.normal');
        var hoverLabelModel = itemModel.getModel('label.emphasis');
        var lastDim = data.dimensions[data.dimensions.length - 1];
        var labelText = seriesModel.getFormattedLabel(idx, 'normal')
                    || data.get(lastDim, idx);
        var elStyle = symbolPath.style;

        var showLabel = labelModel.get('show');
        if (showLabel) {
            graphic.setText(elStyle, labelModel, color);
            elStyle.text = labelText;
        }
        else {
            elStyle.text = '';
        }
        if (zrUtil.retrieve(hoverLabelModel.get('show'), showLabel)) {
            graphic.setText(hoverStyle, hoverLabelModel, color);
            hoverStyle.text = labelText;
        }
        else {
            hoverStyle.text = '';
        }

        graphic.setHoverStyle(symbolPath, hoverStyle);
    };

    symbolProto.fadeOut = function (cb, api) {
        var symbolPath = this.childAt(0);
        // Not show text when animating
        symbolPath.style.text = '';
        api.updateGraphicEl(symbolPath, {
            scale: [0, 0]
        }, cb);
    };

    zrUtil.inherits(Symbol, graphic.Group);

    return Symbol;
});