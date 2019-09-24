//ring layout next

function createPies(svg_r, n, or,id ,dx1, arange){
    var dow = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"],
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        years = d3.range(2015, 2020),
        order = ["year",  "month","day", "hour", "minute", "second" ];
    var pieGenerator = d3.pie();
    var data = getArr(n);
    var arcData = pieGenerator(data);

    var arcGenerator = d3.arc()
        .innerRadius(or-18)
        .outerRadius(or);


    var path_r = svg_r.append('g')
        .attr("id", id)
        .selectAll('path')
        .data(arcData)
        .enter()
        .append('path')
        .style("fill", "none")
        .style("stroke", "white")
        .attr("class", "pathtl")
        .attr("id", function(d,i){ return id+"_"+arange[d.index]})
        .attr("d", function(d){
            return arcGenerator(d)
        })
        .on("click", function(d){
            var item = d3.select(this),
                id = item.attr("id"),
                categ = id.split("-")[1].split("_"),
            db_categ = categ[0], db_value = categ[1];

            if(db_categ === "second") return;

            var order_ind = order.indexOf(db_categ), flag = false;
            if(db_categ === "dow") order_ind = 2;

            for(var i=0;i<order_ind;i++){
                if(tl_dict["tl_"+order[i]].length === 0 && order_ind !== 0){
                    flag = true;
                }

            }
            if(flag) return;


            if(db_categ === "dow")
                db_value = dow.indexOf(db_value);
            if(db_categ === "month")
                db_value = months.indexOf(db_value)+1;



            if(item.classed("p-clicked"))
                item.style("stroke", "none");
            else{
                item.style("stroke", "white");
                item.style("stroke-width", "2");
            }


            item.classed("p-clicked", !item.classed("p-clicked"));

            if(tl_dict["tl_"+db_categ].indexOf(db_value) ===-1)
                tl_dict["tl_"+db_categ].push(db_value);

        });




    // Add labels, using .centroid() to position
    d3.select('#'+id)
        .selectAll('text')
        .data(arcData)
        .enter()
        .append('text')
        .attr("class","ring_text")
        .attr("dx",dx1)
        .attr("dy", 13)
        .style("font-size", "7px")
        .style("font-weight", "bold")
        .append("textPath")
        .attr("startOffset","0%")
        .style("text-anchor","middle")
        .attr("xlink:href",function(d,i){return "#"+id+"_"+arange[d.index];})
        .text(function(d){return arange[d.index];})
        .on("click", function(d){
            var item = d3.select(this),
                id = item.attr("href"),
                categ = id.split("-")[1].split("_"),
                db_group = categ[0], db_value = categ[1];
        });

    d3.selectAll(".pathtl")
        .classed("p-clicked", false)





};




function getArr(ar_range){
    var a = new Array(ar_range);
    for(var i=0;i<a.length;i++){ a[i]= 10;}
    return a
};

function appendRings(stc, edc) {

    var bc = d3.select("#table-rc21").node().getBoundingClientRect();

    var margin_r = {top: 5, right: 1, bottom: 1, left: 5},
        width_r = bc.width-30,
        height_r = width_r,
        innerHeight_r = height_r - 20,
        outermost_radius = 137,
        outermost_radius_trans_X = outermost_radius + margin_r.left,
        outermost_radius_trans_Y = outermost_radius + margin_r.top,
        inner_radius = 18;


     var svg_rings= d3.select("#table-rc21")//.append("div").attr("id","clegendD")
         .append("svg")
         .attr("id", "svg_trc21")
         .attr("width", width_r )
         .attr("height", height_r - 45)
         .style("float", "right");
    var svg_r = svg_rings.append("g")
        .attr("transform", "translate(" + outermost_radius_trans_X  + "," + outermost_radius_trans_Y + ")");

    var arcGenerator = d3.arc()
        .innerRadius(outermost_radius-18)
        .outerRadius(outermost_radius);


    var dow = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"],
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        years = d3.range(2015, 2020);

    createPies(svg_r, 60, outermost_radius, "path-second", 7, d3.range(60));
    createPies(svg_r, 60, outermost_radius - inner_radius, "path-minute", 6, d3.range(60));
    createPies(svg_r, 24, outermost_radius - 2 * inner_radius, "path-hour", 13, d3.range(24));
    createPies(svg_r, 7, outermost_radius - 3 * inner_radius, "path-dow", 40, dow,tl_dict);
    createPies(svg_r, 31, outermost_radius - 4 * inner_radius, "path-day", 6, d3.range(1, 32));
    createPies(svg_r, 12, outermost_radius - 5 * inner_radius, "path-month", 14, months);
    createPies(svg_r, 5, outermost_radius - 6 * inner_radius, "path-year", 20, years);

    //append bottom time selectors

    var rect_length = svg_r.node().getBoundingClientRect(),
    rect_w = rect_length.width/years.length,
    rect_month_w = rect_w / months.length,
    rect_h = 10, r_padding = 5;

    var bottom_svg = svg_rings.append("g")
        .attr("transfrom", "translate("+margin_r.left+","+rect_length.height+rect_h+")");

    bottom_svg.selectAll("g").append("g")
        .data(d3.range(years.length* months.length)).enter()
        .append("rect")
        .attr("class", "month_sel")
        .attr("id", function(d){
            var yearId = Math.floor(d / months.length),
                monthId = d % months.length ;
            return "month_sel_"+years[yearId]+"_"+monthId;
        })
        .attr("width", rect_month_w)
        .attr("height", 2*rect_h)
        .attr("x", function(d,i){
            return i * rect_month_w + margin_r.left;
        })
        .attr("y",rect_length.height +r_padding );


    bottom_svg.selectAll("g").append("g")
        .data(years).enter()
        .append("rect")
        .attr("class", "year_sel")
        .attr("id", function(d){ return "year_sel_"+d;})
        .attr("width", rect_w)
        .attr("height", rect_h)
        .attr("x", function(d,i){
            return i * rect_w + margin_r.left;
        })
        .attr("y",rect_length.height+ 2* rect_h + r_padding);


    bottom_svg.append("g")
        .selectAll("text").data(years).enter()
        .append("text")
        .attr("class", "bottom_year_sel_txt")
        .attr("x", function(d, i){
            return i * rect_w + margin_r.left + rect_w/3;
        })
        .attr("y",rect_length.height+ 2.9* rect_h+r_padding)
        .text(function (d) {
            return d;
        });

    //append enter button
    var btn_g = svg_r.append("g");

    btn_g
        .append("circle")
        .attr("id", "radial-btn")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 10)
        .style("fill", "black")
        .on("click", radialEnterClicked);

    btn_g.append("text")
        .attr("dx", "-7")
        .attr("dy", "2")
        .text("Enter")
        .style("font-size", "0.4em")
        //.style("stroke", "white")
        .style("fill", "white")
        .on("click", function(d){
            radialEnterClicked();
        });

    var digit_format = function(n){
      return n > 9 ? "" + n: "0" + n;
    };

    var heightAxis = 2*outermost_radius_trans_Y+2*rect_h,
        axis_padding = 5;


    d3.select("#timeDropdownLabel")//.append("g").attr("class", "timeSelections")
        .append("label")
        .text("Selected Dates:");

    var dropDown = d3.select("#timeDropdown")
            .append("select")
            .attr("id", "timeSels")
            .attr("multiple", "")
            .style("visibility", "hidden")
            .attr("transform", "translate(5,"+(heightAxis+10)+");");



    var radialEnterClicked = function(){

        var date  = tl_dict["tl_year"]+"-"+digit_format(tl_dict["tl_month"])+"-"+ digit_format(tl_dict["tl_day"])+"T"+digit_format(tl_dict["tl_hour"])+":"+digit_format(tl_dict["tl_minute"])+":"+"00Z";
        radial_hour.push(new Date(date).toISOString().split('.')[0]+"Z");
        d3.selectAll(".pathtl").style("stroke", "none");
        tl_dict ={
            tl_hour:[],
            tl_minute:[],
            tl_day:[],
            tl_dow:[],
            tl_year:[],
            tl_month:[]

        };

        // append options to the select box

        dropDown.style("visibility", "visible");

        var options = dropDown.selectAll("option")
            .data(radial_hour)
            .enter()
            .append("option");

        options.text(function(d) { return d;})
            .attr("value", function(d) { return d; });

    };



    //append legend

    var defs = svg_rings.append("defs");
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color(stc));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color(edc));



    svg_rings.append("rect")
        .attr("x", axis_padding+2* outermost_radius_trans_X)
        .attr("y", margin_r.top )
        .attr("width", 12)
        .attr("height", 2*outermost_radius_trans_Y+2*rect_h)
        .style("stroke","black")
        .style("fill", "url(#linear-gradient)");


    var ya = d3.scaleLinear().range([heightAxis, 0]).domain([0,10]),
        yaxis = d3.axisRight(ya)//.tickValues(d3.range(10))
            .tickFormat(function(d,i) {
                return Math.floor(100* (10-d)/10)+"%";
            });

    svg_rings.append("g")
        .attr("class", "axisL")  //Assign "axis" class
        .attr("transform", "translate(" +  (2* outermost_radius_trans_X+12+axis_padding)  + "," + margin_r.top + ")")
        .call(yaxis);




};

function updateRings(cnames_all, flag =-1){
    var updates = ["day","year", "hour", "minute", "month", "dow", "second", "timestamp" ];

    d3.selectAll(".pathtl").style("fill", "none");
    updates.forEach(function(x){



        db_groups = getSearchParams(x,cnames_all );

        Promise.all([query_res(JSON.stringify(db_groups))]).then(function(resp1) {

            var db_res = resp1[0].aggregations.error["group_by_"+x].buckets;

            if (x !== "timestamp"){

                var data_V = {};
                for (var i = 0; i < db_res.length; i++) {
                    data_V[db_res[i].key] = db_res[i].doc_count;
                }
                var range = (flag===1) ? [1,5]: (flag===2) ? [0,10000]: [0,50000];

                changePathColors(d3.selectAll("#path-" + x+" path"), data_V, x.toString(), range);


            }else{

                // append options to the select box
                var dropDown = d3.select("#timeSels");
                var data_sel = [];
                d3.range(db_res.length).forEach(i => data_sel.push(new Date(db_res[i].key).toISOString().split(".")[0]+"Z"));
                dropDown.style("visibility", "visible");
                dropDown.selectAll("option").remove();

                var options = dropDown.selectAll("option")
                    .data(data_sel)
                    .enter()
                    .append("option");

                options.text(function(d) { return d;})
                    .attr("value", function(d) { return d; });

            };


        }).catch(function(error){
            console.log("Error in promise...",error, x)
        });
    }); // ring layout
}
