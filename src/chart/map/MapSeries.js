define(function (require) {

    var List = require('../../data/List');
    var echarts = require('../../echarts');
    var SeriesModel = require('../../model/Series');
    var zrUtil = require('zrender/core/util');

    var formatUtil = require('../../util/format');
    var encodeHTML = formatUtil.encodeHTML;
    var addCommas = formatUtil.addCommas;

    var dataSelectableMixin = require('../helper/dataSelectableMixin');

    function fillData(dataOpt, geoJson) {
        var dataNameMap = {};
        var features = geoJson.features;
        for (var i = 0; i < dataOpt.length; i++) {
            dataNameMap[dataOpt[i].name] = dataOpt[i];
        }

        for (var i = 0; i < features.length; i++) {
            var name = features[i].properties.name;
            if (!dataNameMap[name]) {
                dataOpt.push({
                    value: NaN,
                    name: name
                });
            }
        }
        return dataOpt;
    }

    var MapSeries = SeriesModel.extend({

        type: 'series.map',

        /**
         * Only first map series of same mapType will drawMap
         * @type {boolean}
         */
        needsDrawMap: false,

        /**
         * Group of all map series with same mapType
         * @type {boolean}
         */
        seriesGroup: [],

        init: function (option) {

            option = this._fillOption(option);
            this.option = option;

            SeriesModel.prototype.init.apply(this, arguments);

            this.updateSelectedMap();
        },

        getInitialData: function (option) {
            var list = new List([{
                name: 'value'
            }], this);

            list.initData(option.data);

            return list;
        },

        mergeOption: function (newOption) {
            newOption = this._fillOption(newOption);
            SeriesModel.prototype.mergeOption.call(this, newOption);
            this.updateSelectedMap();
        },

        _fillOption: function (option) {
            // Shallow clone
            option = zrUtil.extend({}, option);

            var geoJson = echarts.getMap(option.mapType);
            geoJson && option.data
                && (option.data = fillData(option.data, geoJson));

            return option;
        },

        /**
         * @param {number} zoom
         */
        setRoamZoom: function (zoom) {
            var roamDetail = this.option.roamDetail;
            roamDetail && (roamDetail.zoom = zoom);
        },

        /**
         * @param {number} x
         * @param {number} y
         */
        setRoamPan: function (x, y) {
            var roamDetail = this.option.roamDetail;
            if (roamDetail) {
                roamDetail.x = x;
                roamDetail.y = y;
            }
        },

        /**
         * Map tooltip formatter
         *
         * @param {number} dataIndex
         */
        formatTooltip: function (dataIndex) {
            var data = this._data;
            var formattedValue = addCommas(data.getRawValue(dataIndex));
            var name = data.getName(dataIndex);

            var seriesGroup = this.seriesGroup;
            var seriesNames = [];
            for (var i = 0; i < seriesGroup.length; i++) {
                var subData = seriesGroup[i].getData();
                if (!isNaN(subData.getRawValue(dataIndex))) {
                    seriesNames.push(
                        encodeHTML(seriesGroup[i].name)
                    );
                }
            }

            return seriesNames.join(', ') + '<br />'
                + name + ' : ' + formattedValue;
        },

        defaultOption: {
            // 一级层叠
            zlevel: 0,
            // 二级层叠
            z: 2,
            coordinateSystem: 'geo',
            // 各省的 map 暂时都用中文
            map: 'china',

            // 'center' | 'left' | 'right' | 'x%' | {number}
            x: 'center',
            // 'center' | 'top' | 'bottom' | 'x%' | {number}
            y: 'center',
            // x2
            // y2
            // width: '60%'
            // height   // 自适应

            // 数值合并方式，默认加和，可选为：
            // 'sum' | 'average' | 'max' | 'min'
            // mapValueCalculation: 'sum',
            // 地图数值计算结果小数精度
            // mapValuePrecision: 0,
            // 显示图例颜色标识（系列标识的小圆点），图例开启时有效
            showLegendSymbol: true,
            // 选择模式，默认关闭，可选single，multiple
            // selectedMode: false,
            dataRangeHoverLink: true,
            hoverable: true,
            clickable: true,
            // 是否开启缩放及漫游模式
            // roam: false,

            // 在 roam 开启的时候使用
            roamDetail: {
                x: 0,
                y: 0,
                zoom: 1
            },

            label: {
                normal: {
                    show: false,
                    textStyle: {
                        color: '#000'
                    }
                },
                emphasis: {
                    show: false,
                    textStyle: {
                        color: '#000'
                    }
                }
            },
            // scaleLimit: null,
            itemStyle: {
                normal: {
                    // color: 各异,
                    borderWidth: 0.5,
                    borderColor: '#444',
                    areaColor: '#eee'
                },
                // 也是选中样式
                emphasis: {
                    areaColor: 'rgba(255,215,0,0.8)'
                }
            }
        }
    });

    zrUtil.mixin(MapSeries, dataSelectableMixin);

    return MapSeries;
});