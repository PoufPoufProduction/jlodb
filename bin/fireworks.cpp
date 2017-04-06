#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <sys/time.h>
#include <iostream>

int main(int argc, char * argv[])
{
    const static int    colormax = 10;
    
    unsigned int        argid   = 1;
    bool                finish  = false;
    int                 c       = -1;
    int                 nb      = 40;
    int                 ox      = 24;
    int                 oy      = 20;
    int                 vx      = 0;
    int                 vy      = -5;
    float               vz      = 1.0;
    float               size    = 2;
    float               gravity = 1.0;
    float               pos[100][12][2];
    float               rotation[100][12];
    float               def[100][2];
    char                color[100][colormax];
    
    do {
        if (!(finish=(argid>=argc))) {

            if (!strcmp(argv[argid],"-n") && (++argid<argc)) {
                nb = atoi(argv[argid]);
                if (nb>100) { nb = 100; }
            } else
            if (!strcmp(argv[argid],"-s") && (++argid<argc)) {
                size = atof(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-c") && (++argid<argc)) {
                c = atoi(argv[argid]);
                if (c>4) { c=-1; }
            } else
            if (!strcmp(argv[argid],"-x") && (++argid<argc)) {
                ox = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-y") && (++argid<argc)) {
                oy = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-X") && (++argid<argc)) {
                vx = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-Y") && (++argid<argc)) {
                vy = atoi(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-Z") && (++argid<argc)) {
                vz = atof(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-g") && (++argid<argc)) {
                gravity = atof(argv[argid]);
            } else
            if (!strcmp(argv[argid],"-h")) {
                std::cout<<"usage: gen [options]"<<std::endl;
                std::cout<<" -n integer    : number of confetti      [40]"<<std::endl;
                std::cout<<" -c integer    : color                   []"<<std::endl;
                std::cout<<" -s integer    : average confetti size   [2]"<<std::endl;
                std::cout<<" -x integer    : explosion x-axis origin [24]"<<std::endl;
                std::cout<<" -y integer    : explosion y-axis origin [20]"<<std::endl;
                std::cout<<" -g integer    : gravity factor          [1.0]"<<std::endl;
                std::cout<<" -X integer    : average x-axis velocity [0]"<<std::endl;
                std::cout<<" -Y integer    : average y-axis velocity [-5]"<<std::endl;
                std::cout<<" -Z integer    : velocity variation      [1.0]"<<std::endl;
                return 1;
            }

        }
        argid++;
    } while(!finish);
    
    timeval t; gettimeofday(&t, NULL); srand(t.tv_usec);

    // CALCULATE CONFETTI MOVEMENTS
    for (int i=0; i<nb; i++) {
        // COLOR
        switch (c<0||c>4?rand()%5:c) {
            case 0 : snprintf(color[i],colormax,"FF5588"); break;
            case 1 : snprintf(color[i],colormax,"5588FF"); break;
            case 2 : snprintf(color[i],colormax,"55FF88"); break;
            case 3 : snprintf(color[i],colormax,"DD55DD"); break;
            case 4 : snprintf(color[i],colormax,"DDDD55"); break;
        }
        
        // SIZE
        def[i][0] = size*(0.5+((float)(rand()%100))/100);
        def[i][1] = size*(0.5+((float)(rand()%100))/100);
        
        // ROTATION
        rotation[i][0] = rand()%360;
        float v_rotation = 50.0*(1-2*((float)(rand()%100))/100);
        
        // POSITION
        pos[i][0][0] = ox+size*(0.5-(float)(rand()%100)/100);
        pos[i][0][1] = oy+size*(0.5-(float)(rand()%100)/100);
        float v_x = 1.0*vx*(0.5+0.5*(float)(rand()%100)/100)+3*vz*(0.5-(float)(rand()%100)/100);
        float v_y = 1.0*vy*(0.5+0.5*(float)(rand()%100)/100)+3*vz*(0.5-(float)(rand()%100)/100);
        
        // std::cout<<"DEBUG: ["<<i<<"] "<<"(color: #"<<color[i]<<") (size: "<<def[i][0]<<"x"<<def[i][1]<<") (rotation: "<<rotation[i][0]<<"|"<<v_rotation<<") (x: "<<pos[i][0][0]<<"|"<<v_x<<") (y: "<<pos[i][0][1]<<"|"<<v_y<<")"<<std::endl;
        
        // MOVE
        for (int j=1; j<12; j++)
        {
            rotation[i][j] = rotation[i][j-1]+v_rotation;
            pos[i][j][0] = pos[i][j-1][0]+v_x;
            pos[i][j][1] = pos[i][j-1][1]+v_y+gravity*j;
        }
        
    }
    
    // RENDER SVG
    std::cout<<"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>"<<std::endl;
    std::cout<<"<svg xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.0\" width=\"100%\" height=\"100%\" viewBox=\"0 0 48 576\" id=\"confetti\" style=\"display:inline\">"<<std::endl;
    std::cout<<"<defs/>"<<std::endl;
    
    for (int j=0; j<12; j++) for (int i=0; i<nb; i++) {
        float px = pos[i][j][0];
        float py = pos[i][j][1];
        float d[2] = { py, 48-py };
        float min = 24;
        for (int m=0; m<2; m++) { if (min>d[m]) { min=d[m]; }}
        if (min>def[i][1]) {
            float opacity = 1;
            if (j==10) { opacity*=0.6; } else if (j==11) { opacity*=0.3; }
            std::cout<<"<g transform=\"translate("<<px<<","<<(py+48*j)<<")\" style=\"opacity:"<<opacity<<";\">";
            std::cout<<"<g transform=\"rotate("<<rotation[i][j]<<")\">";
            std::cout<<"<rect x=\""<<(-def[i][0]/2)<<"\" y=\""<<(-def[i][1]/2)<<"\"";
            std::cout<<" width=\""<<def[i][0]<<"\" height=\""<<def[i][1]<<"\" ry=\""<<(size/4)<<"\"";
            std::cout<<" style=\"fill:#"<<color[i]<<";\"/>";
            std::cout<<"</g>";
            std::cout<<"</g>"<<std::endl;
        }
    }
    
    std::cout<<"</svg>"<<std::endl;
    
    
    return 1;
}

