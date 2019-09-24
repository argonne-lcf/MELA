function appendWordStacks(stacked_par, filename){


    var svg = stacked_par['svg'],
        width = stacked_par['width'],
        height = stacked_par['height'],
        margin = stacked_par['margin'],
        padding = stacked_par['padding'];

    d3.select("#topicTooltip").transition().remove();
    d3.select("#topicStacks").transition().remove();

    var g = svg.append("g")
        .attr("id", "topicStacks")
        .attr("transform", "translate(" + (margin.left + width + (14.5* padding.left)) + "," + (2*margin.top) + ")");

    width = 200;
    height = height - 50;

    // set y scale
    var y = d3.scaleBand()
        .rangeRound([0, height])
        .paddingInner(0.05)
        .align(0.1);

    // set x scale
    var x = d3.scaleLinear()
        .rangeRound([0, width]);

    // set the colors
    var z = colorWc;

    // load the csv and create the chart
    d3.csv("./static/data_stacked/"+filename,type, function(error , data1) {

        if(error) throw error;

        var data = data1.slice(0,20);
        var keys = d3.range(5)//Object.keys(data[0]).slice(1);
        data = data.map((d, i, columns) => prepData(d,i, keys));

        data.sort(function(a, b) { return b.total - a.total; });
        y.domain(data.map(function(d) {
            return d.word;
        }));
        x.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
        z.domain(keys);

        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d.data.word); })
            .attr("height", y.bandwidth())
            .style("fill-opacity",0.4)
            .style("stroke", "#000")
            .style("stroke-width", "0.3px")
            .style("opacity" ,1)
            .attr("width", function(d){return x(d[1]) - x(d[0])})
            //.on("mouseover", function() { tooltip.style("display", null); })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");

                sliderVal = globSliderVal;
                d3.selectAll(".wordcloud.t120 text").each((x, i, n) =>{

                    if((x.score >= sliderVal[0]) ? ( (x.score <= sliderVal[1]) ? 0:1) : 1)
                        d3.select(n[i]).style("opacity", 0);
                    else
                        d3.select(n[i]).style("opacity", 1);
                });
            })
            .on("mouseover", function(d) {

                var xPosition = d3.mouse(this)[0] + stacked_par["width"] + 200;
                var yPosition = d3.mouse(this)[1] + 5 + (2* padding.top);

                tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                tooltip.style("visibility", "visible")
                tooltip.select("text")
                    .text(d3.format(".2f")(d[1]-d[0]))
                    .style("stroke-width", "0.5px");

                var word = d.data.word;
                d3.selectAll(".wordcloud.t120 text").each((x, i, n) =>{

                    var opacity_ori = d3.select(n[i]).style("opacity");

                    x.twords !== word ?d3.select(n[i]).style("opacity", opacity_ori === "1"?0.3:opacity_ori)
                        : d3.select(n[i]).style("opacity", 1);
                });

            });

        g.append("g")
            .attr("class", "axis--ws")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate("+11+", "+padding.top+")rotate(90)");

        g.append("g")
            .attr("class", "axis--ws")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .append("text")
            .attr("x", 2)
            .attr("y", x(x.ticks().pop()))
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start");

        var legend = g.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(-10," + (i+5) * 20 + ")"; });

        legend.append("rect")
            .attr("x", width -10 )
            .attr("width", 19)
            .attr("height", 18)
            .attr("fill", z)
            .style("fill-opacity", 0.4)
            .style("stroke", "#000")
            .style("stroke-width", "0.3px")
            .style("opacity" ,1)
            .on("mouseout", function(){
                // tooltip.style("visibility", "hidden");
                d3.select(this).style("fill-opacity", 0.4);

            })
            .on("mouseover", function(_){
                 d3.select(this).style("fill-opacity", 1);
            }).on("click",function(d){
            return appendWordStacks(stacked_par, "stacked_words_"+d+".csv");
        });

        legend.append("text")
            .attr("x", width -14)
            .attr("y", 10)
            .attr("dy", "0.32em")
            .text(function(d) { return "Topic "+d; });
    });

    // initial display is hidden
    var tooltip = svg.append("g")
        .attr("class", "tooltip")
        .attr("id","topicTooltip")
        .style("visibility", "hidden");

    tooltip.append("rect")
        .attr("width", 60)
        .attr("height", 20)
        .style("stroke", "white")
        .style("opacity", "0");

    tooltip.append("text")
        .attr("x", 30)
        .attr("dy", "1.2em")
        .style("stroke", "#000")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "normal");

    function prepData(d, i, keys){
        var t = 0.0;
        keys.forEach(k => {
            t += d[k] = +d[k];
        });
        d.total = t;

        return d;
    };

    function type(d){
        var word = d.word;
        stopwords.forEach(w => {
            word = word.replace(w, "")
        });
        d.word = word;

        return d;

    }

}