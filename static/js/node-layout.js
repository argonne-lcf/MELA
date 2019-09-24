function appendNodeLayout(resp,color) {

    d3.selectAll("#theta-nodes").remove();



    var hwerr = resp.aggregations.group_by_cname_id.buckets;

    var data_hwerr = {};

    for (var i = 0; i < hwerr.length; i++) {
        data_hwerr[hwerr[i].key] = hwerr[i].doc_count;
    }


    var values = Object.keys(data_hwerr).map(function(key){
        return data_hwerr[key];
    });

    // color =  d3.scaleSequential(d3.interpolatePuRd)
    //     .domain([Math.min(...values), Math.max(...values)]);

    var cell_width = 9.1;
    var cell_height = 5;
    var nps = 4;
    var npr = 8;
    var npc = 24;
    var rack_width = cell_width * npr;
    var rack_height = cell_height * npc;
    var racks_per_row = 12;
    var rack_count = racks_per_row * 2;
    var rack_padding = 20;
    var inter_rack_padding = 4;
    var r_n_padding = 17;
    var svg_width = racks_per_row * (rack_width + inter_rack_padding);
    var svg_height = 20 + 2 * rack_height + rack_padding + 2 * r_n_padding;
    var spcage = 16;
    var sprack = 3;
    var cage_count = 6;
    var cage_width = nps * cell_width;
    var cage_height = npr * cell_height;
    var tau = 2 * Math.PI;
    var rads1 = [80, 97, 110, 127, 140, 157, 170, 187, 200, 217];
    var rads = [20, 37, 50, 67, 80, 97, 110, 127, 140, 157];
    var arcs = [20, 50, 80, 110, 140, 170];
    var nb_selections = [];
    var year_10 = ["2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018"];

    var attributesText = d3.select("#attributestext");
    var selectionRect = {
        element: null,
        previousElement: null,
        currentY: 0,
        currentX: 0,
        originX: 0,
        originY: 0,
        setElement: function (ele) {
            this.previousElement = this.element;
            this.element = ele;
        },
        getNewAttributes: function () {
            var x = this.currentX < this.originX ? this.currentX : this.originX;
            var y = this.currentY < this.originY ? this.currentY : this.originY;
            var width = Math.abs(this.currentX - this.originX);
            var height = Math.abs(this.currentY - this.originY);
            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        },
        getCurrentAttributes: function () {
            // use plus sign to convert string into number
            var x = +this.element.attr("x");
            var y = +this.element.attr("y");
            var width = +this.element.attr("width");
            var height = +this.element.attr("height");
            return {
                x1: x,
                y1: y,
                x2: x + width,
                y2: y + height
            };
        },
        getCurrentAttributesAsText: function () {
            var attrs = this.getCurrentAttributes();
            return "x1: " + attrs.x1 + " x2: " + attrs.x2 + " y1: " + attrs.y1 + " y2: " + attrs.y2;
        },
        init: function (newX, newY) {
            var rectElement = svg.append("rect")
                .attr('rx', 4)
                .attr('ry', 4)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', 0)
                .classed("selection", true);
            this.setElement(rectElement);
            this.originX = newX;
            this.originY = newY;
            this.update(newX, newY);
        },
        update: function (newX, newY) {
            this.currentX = newX;
            this.currentY = newY;

            attris = this.getNewAttributes();

            this.element.attr('height', attris['height'])
                .attr('width', attris['width'])
                .attr('x', attris['x'])
                .attr('y', attris['y']);
        },
        focus: function () {
            this.element
                .style("stroke", "#b33c00")
                .style("fill", "#fcab83")
                .style("opacity", "0.5")
                .style("stroke-dasharray", "5,5")
                .style("stroke-width", "2");
        },
        remove: function () {
            this.element.remove();
            this.element = null;
        },
        removePrevious: function () {
            if (this.previousElement) {
                // this.previousElement.remove();
            }
        }
    };



    function highlightNodeboards(shift_key) {

        x1 = selectionRect.originX;
        x2 = selectionRect.currentX;
        y1 = selectionRect.originY;
        y2 = selectionRect.currentY;

        var nodeboards = d3.selectAll('.nodes').each(function (d) {
            nb = d3.select(this);
            var x = +nb.attr("x") + 5;
            var y = +nb.attr("y") + cell_height - 3;
            var nb_id = nb.attr("id");

            var x_truth = (x > x1) ? ((x < x2) ? true : (x - cell_width < x2)) : (x + cell_width > x1);
            var y_truth = (y > y1) ? ((y < y2) ? true : (y - cell_height < y2)) : (y + cell_height > y1);

            if (x_truth && y_truth && !shift_key) {

                if (!(nb_id.toString() in nb_selections))
                    nb_selections.push(nb_id)

            } else if (x_truth && y_truth && shift_key) {


                var ind = nb_selections.indexOf(d.toString());
                if (ind > -1) {
                    nb_selections.splice(ind, 1);
                }
                var c = (d in data_hwerr) ? data_hwerr[d]: 0;
                nb.style("fill", color(c));
            }


        });


    };

    var drag = d3.drag()
        .on("drag", function (d, i) {
            var p = d3.mouse(this);
            selectionRect.update(p[0], p[1]);
            selectionRect.focus();
            attributesText
                .text(selectionRect.getCurrentAttributesAsText());
        })
        .on("start", function () {
            var p = d3.mouse(this);
            selectionRect.init(p[0], p[1]);
            selectionRect.removePrevious();
        })
        .on("end", function () {
            var finalAttributes = selectionRect.getCurrentAttributes();

            if (finalAttributes.x2 - finalAttributes.x1 > 1 && finalAttributes.y2 - finalAttributes.y1 > 1) {
                // range selected
                d3.event.sourceEvent.preventDefault();
                selectionRect.focus();
                var shift_key = false;
                if (d3.event.sourceEvent.shiftKey) {
                    shift_key = true;

                }

                highlightNodeboards(shift_key);
            } else {

                selectionRect.remove();
            }
        });


    var color_arc1 = d3.scaleQuantize()
        .domain([-1, 60])
        .range([
            "#1b70fc", "#faff16", "#d50527", "#158940", "#f898fd", "#24c9d7",
            "#cb9b64", "#866888", "#22e67a", "#e509ae", "#9dabfa", "#437e8a",
            "#b21bff", "#ff7b91", "#94aa05", "#ac5906", "#82a68d", "#fe6616",
            "#7a7352", "#f9bc0f", "#b65d66", "#07a2e6", "#c091ae", "#8a91a7",
            "#88fc07", "#ea42fe", "#9e8010", "#10b437", "#c281fe", "#f92b75",
            "#07c99d", "#a946aa", "#bfd544", "#16977e", "#ff6ac8", "#a88178",
            "#fe9169", "#cd714a", "#6ed014", "#c5639c", "#c23271", "#698ffc",
            "#678275", "#c5a121", "#a978ba", "#ee534e", "#d24506", "#59c3fa",
            "#ca7b0a", "#6f7385", "#9a634a", "#48aa6f", "#ad9ad0", "#d7908c",
            "#6a8a53", "#8c46fc", "#8f5ab8", "#fd1105", "#7ea7cf", "#d77cd1",
            "#a9804b", "#0688b4", "#6a9f3e", "#ee8fba", "#a67389", "#9e8cfe",
            "#bd443c", "#6d63ff", "#d110d5", "#798cc3", "#df5f83", "#b1b853"]
        );



    var svg = d3.select("#table-rc22").append('svg')
        .attr("id","theta-nodes")
        .attr("width", svg_width + rack_padding)
        .attr("height", svg_height - 20)
        .style("padding", "2px")
        .append("g")
        .style("padding", "2px")
        .style("fill", "none")
        .call(drag);


    Array.prototype.groupBy_items = function (prop) {
        return this.reduce(function (groups, item) {
            const val = item[prop];
            groups[val] = groups[val] || 0;
            groups[val] += parseInt(item.value)//groups[val]+item.value);
            return groups
        }, {})
    };



    d3.select("body").on("keypress", function () {



        if (d3.event.keyCode === 13 && nb_selections.length !== 0) {

            d3.selectAll(".cname-group").remove();

            var drop_down = nb_selections;

            var select = d3.select("#cname_selections")
                .on("change", function(){
                    var selectedCname = d3.select(this).property('value');
                    Sijax.request('getSedc', [selectedCname])

                });



            var options = select.selectAll("option")
                .data(drop_down)
                .enter()
                .append("option")
                .text(function(d){
                    return "CNAME_"+d;
                })
                .attr("value", function(d){ return d});


            // for keypress enter. load ring layout colors
            updateRings(nb_selections, 2);



        };


    });

    var racks = svg.append("g").selectAll("g")
        .data(d3.range(rack_count))
        .enter()
        .append("rect")
        .attr("class", "racks")
        .attr("width", rack_width)
        .attr("height", rack_height)
        .attr("x", function (d) {
            var x = r_n_padding + (d % racks_per_row) * (rack_width + inter_rack_padding);
            return x;
        })
        .attr("y", function (d) {
            var y = r_n_padding + (rack_height + rack_padding) * (Math.floor(d / racks_per_row) + 1) - (2 * (rack_height + rack_padding) * (Math.floor(d / racks_per_row)));
            return y;
        });


    var names = svg.append("g").selectAll("text")
        .data(d3.range(rack_count))
        .enter().append("text")
        .attr("class", "rack_names")
        .attr("x", function (d) {
            var x = r_n_padding + rack_width / 3.2 + (d % racks_per_row) * (rack_width + inter_rack_padding);
            return x;
        })
        .attr("y", function (d) {
            var y = r_n_padding - 2 + (rack_height + (rack_padding)) * (Math.floor(d / racks_per_row) + 1) - (2 * (rack_height + rack_padding) * (Math.floor(d / racks_per_row)));
            return y;
        })
        .text(function (d) {
            return "c" + (d % 12) + "-" + Math.floor(d / 12);
        });


    var nodes = svg.append("g").selectAll("g")
        .data(hwerr)//d3.range(nps * spcage * sprack * rack_count))
        .enter().append("rect")
        .style("fill", function (d1, d) {
            var c = color(0);
            v = data_hwerr[d.toString()];
            c = color(v);
            return c;
        })
        .attr("class", function(){ return "nodes"})
        .attr("width", cell_width)
        .attr("height", cell_height)
        .attr("id", function (d1,d) {
            return d;
        })
        .attr("x", function (d1, d) {
            if(Math.floor(d/ (npr * npc * racks_per_row)) === 1)
                d = Math.floor(d % (npr * npc * racks_per_row));

            var x = r_n_padding + (d % nps) * cell_width
                + Math.floor(d / (nps * spcage / 2)) * cage_width
                - Math.floor(d / (nps * spcage)) * 2 * cage_width
                + Math.floor(d / (npr * npc)) * (2 * cage_width + inter_rack_padding);

            return x;
        })
        .attr("y", function (d1, d) {

            var padding_nodes = r_n_padding + (rack_height * 2 + rack_padding - cell_height)

            if(Math.floor(d/ (npr * npc * racks_per_row)) === 1)
                padding_nodes = padding_nodes - rack_padding - rack_height;


            var y = padding_nodes
                - Math.floor((d % (nps * spcage / 2)) / nps) * cell_height
                - Math.floor((d % (npr * npc )) / (nps * spcage)) * cage_height
                - Math.floor((d % (npr * npc )) / (npr * npc)) * (rack_padding);

            return y;
        }).on("mouseover", function (d1, d) {

            var node_1 = d3.select(this);
            var data_hwerr_hover = node_1.datum() == undefined ? data_hwerr : node_1.datum();
            svg.append("rect")
                .attr("id", "tooltipRect")
                .attr("width", 180)
                .attr("height", 20)
                .attr("x", function (d1) {

                    return  ((d > 1760) && (d < 2304) || (d > 4064)) ? (parseInt(node_1.attr("x"))-150) : (parseInt(node_1.attr("x"))+20);
                })
                .attr("y", function (d1) {

                    return ((d > 1760) && (d < 2304) || (d > 4064)) ? (node_1.attr("y")-18) : (node_1.attr("y")-18);
                })
                .style("stroke", "white")
                .style("fill", "#f0e4e4")
                .style("opacity", "0.7");

           svg.append("text")
                .attr("id", "tooltipNode")
                .attr("class", "texts tooltip")
                .attr("x", function (d1) {
                    return ((d > 1760) && (d < 2304) || (d > 4064)) ? (parseInt(node_1.attr("x"))-145) : (parseInt(node_1.attr("x"))+30) ;
                })
                .attr("y", function (d1) {
                    return node_1.attr("y")-5
                })
                .style("font-size", "1em")
                .style("font-family", "monospace")
                .text(function () {
                    var v = Object.keys(data_hwerr_hover).length > 2 ? data_hwerr_hover[d.toString()] : data_hwerr_hover.doc_count;
                    v = v == undefined ? 0: v;
                    return "Node: "+d+" \n Value: " + v;
                })
        }).on("mouseout", function () {

            d3.selectAll("#tooltipRect").remove();

            d3.selectAll("#tooltipNode").remove();
        })
        .on('click', function(){

            nb_selections.push(d3.select(this).attr("id"));
        });


    var cages = svg.append("g").selectAll("g")
        .data(d3.range(cage_count * rack_count))
        .enter().append("rect")
        .attr("class", "cages")
        .attr("width", cage_width)
        .attr("height", cage_height)
        .attr("x", function (d) {
            var x = r_n_padding + (d % (racks_per_row * 2)) * cage_width + Math.floor((d % (2 * racks_per_row)) / 2) * inter_rack_padding;
            return x;
        })
        .attr("y", function (d) {
            var y = r_n_padding + Math.floor(d / (racks_per_row * 2)) * cage_height + Math.floor(d / (3 * 2 * racks_per_row)) * rack_padding;
            return y;
        });





};

